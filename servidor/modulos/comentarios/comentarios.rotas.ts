import { Router } from 'express'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  atividades,
  comentarios,
  materiais,
  respostasComentario,
  usuarios,
  versoesMaterial,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { notificarClienteProjetoAlterado } from '../../servicos/notificar-cliente-projeto.servico.js'

const novoComentario = z.object({
  versaoMaterialId: z.string().uuid(),
  texto: z.string().trim().min(1).max(5000),
  posicaoX: z.number().min(0).max(1),
  posicaoY: z.number().min(0).max(1),
})
const texto = z.object({ texto: z.string().trim().min(1).max(5000) })
export const comentariosRotas = Router()

const autorNomeSql = sql<string>`coalesce(${comentarios.autorExternoNome}, ${usuarios.nome}, 'Cliente')`.as(
  'autorNome',
)

async function comentarioDoWorkspace(comentarioId: string, workspaceId: string) {
  const [comentario] = await banco
    .select()
    .from(comentarios)
    .where(
      and(
        eq(comentarios.id, comentarioId),
        eq(comentarios.workspaceId, workspaceId),
        isNull(comentarios.excluidoEm),
      ),
    )
    .limit(1)
  if (!comentario)
    throw new ErroHttp(404, 'Comentario nao encontrado.', 'comentario_nao_encontrado')
  return comentario
}

comentariosRotas.get('/materiais/:materialId/comentarios', async (req, res) => {
  const [material] = await banco
    .select({ id: materiais.id })
    .from(materiais)
    .where(
      and(
        eq(materiais.id, String(req.params.materialId)),
        eq(materiais.workspaceId, req.sessao!.workspaceId),
        isNull(materiais.excluidoEm),
      ),
    )
    .limit(1)
  if (!material) throw new ErroHttp(404, 'Material nao encontrado.', 'material_nao_encontrado')
  const versaoId = typeof req.query.versaoId === 'string' ? req.query.versaoId : undefined
  const dados = await banco
    .select({ comentario: comentarios, autorNome: autorNomeSql })
    .from(comentarios)
    .leftJoin(usuarios, eq(usuarios.id, comentarios.usuarioId))
    .where(
      and(
        eq(comentarios.materialId, material.id),
        isNull(comentarios.excluidoEm),
        versaoId ? eq(comentarios.versaoMaterialId, versaoId) : undefined,
      ),
    )
    .orderBy(asc(comentarios.criadoEm))
  const ids = dados.map((d) => d.comentario.id)
  const respostas = ids.length
    ? await banco
        .select({ resposta: respostasComentario, autorNome: usuarios.nome })
        .from(respostasComentario)
        .innerJoin(usuarios, eq(usuarios.id, respostasComentario.usuarioId))
        .where(
          and(isNull(respostasComentario.excluidoEm), sqlIn(respostasComentario.comentarioId, ids)),
        )
        .orderBy(asc(respostasComentario.criadoEm))
    : []
  res.json({
    dados: dados.map((d) => ({
      ...d,
      respostas: respostas.filter((r) => r.resposta.comentarioId === d.comentario.id),
    })),
  })
})

comentariosRotas.post(
  '/materiais/:materialId/comentarios',
  exigirFuncao('criativo'),
  validarCorpo(novoComentario),
  async (req, res) => {
    const [material] = await banco
      .select()
      .from(materiais)
      .where(
        and(
          eq(materiais.id, String(req.params.materialId)),
          eq(materiais.workspaceId, req.sessao!.workspaceId),
          isNull(materiais.excluidoEm),
        ),
      )
      .limit(1)
    if (!material) throw new ErroHttp(404, 'Material nao encontrado.', 'material_nao_encontrado')
    const [versao] = await banco
      .select({ id: versoesMaterial.id })
      .from(versoesMaterial)
      .where(
        and(
          eq(versoesMaterial.id, req.body.versaoMaterialId),
          eq(versoesMaterial.materialId, material.id),
          isNull(versoesMaterial.excluidoEm),
        ),
      )
      .limit(1)
    if (!versao) throw new ErroHttp(422, 'Versao invalida para este material.', 'versao_invalida')
    const id = novoId()
    const agora = new Date()
    await banco.transaction(async (tx) => {
      await tx.insert(comentarios).values({
        id,
        workspaceId: material.workspaceId,
        materialId: material.id,
        usuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        atualizadoEm: agora,
        ...req.body,
        posicaoX: String(req.body.posicaoX),
        posicaoY: String(req.body.posicaoY),
      })
      await tx
        .update(materiais)
        .set({
          status: material.status === 'aprovado' ? 'em_revisao' : material.status,
          atualizadoEm: agora,
        })
        .where(eq(materiais.id, material.id))
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: material.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: material.projetoId,
        materialId: material.id,
        versaoMaterialId: versao.id,
        comentarioId: id,
        tipo: 'comentario_criado',
        descricao: 'Comentario contextualizado criado',
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: material.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} adicionou um comentario no material "${material.nome}".`,
    })
    res.status(201).json({ dado: { id } })
  },
)

comentariosRotas.patch('/comentarios/:comentarioId', validarCorpo(texto), async (req, res) => {
  const c = await comentarioDoWorkspace(String(req.params.comentarioId), req.sessao!.workspaceId)
  if (c.usuarioId !== req.sessao!.usuarioId)
    throw new ErroHttp(403, 'Somente o autor pode editar este comentario.', 'sem_permissao')
  await banco
    .update(comentarios)
    .set({ texto: req.body.texto, atualizadoEm: new Date() })
    .where(eq(comentarios.id, c.id))
  res.json({ mensagem: 'Comentario atualizado.' })
})
comentariosRotas.delete('/comentarios/:comentarioId', async (req, res) => {
  const c = await comentarioDoWorkspace(String(req.params.comentarioId), req.sessao!.workspaceId)
  if (c.usuarioId !== req.sessao!.usuarioId && req.sessao!.funcao !== 'administrador')
    throw new ErroHttp(403, 'Somente o autor pode excluir este comentario.', 'sem_permissao')
  await banco
    .update(comentarios)
    .set({ excluidoEm: new Date(), atualizadoEm: new Date() })
    .where(eq(comentarios.id, c.id))
  res.status(204).end()
})
comentariosRotas.post(
  '/comentarios/:comentarioId/respostas',
  validarCorpo(texto),
  async (req, res) => {
    const c = await comentarioDoWorkspace(String(req.params.comentarioId), req.sessao!.workspaceId)
    const agora = new Date()
    const id = novoId()
    await banco.transaction(async (tx) => {
      await tx.insert(respostasComentario).values({
        id,
        comentarioId: c.id,
        usuarioId: req.sessao!.usuarioId,
        texto: req.body.texto,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: c.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        materialId: c.materialId,
        versaoMaterialId: c.versaoMaterialId,
        comentarioId: c.id,
        tipo: 'comentario_respondido',
        descricao: 'Resposta adicionada ao comentario',
        criadoEm: agora,
      })
    })
    res.status(201).json({ dado: { id } })
  },
)

for (const [caminho, status, tipo] of [
  ['resolver', 'resolvido', 'comentario_resolvido'],
  ['reabrir', 'aberto', 'comentario_reaberto'],
] as const) {
  comentariosRotas.post(`/comentarios/:comentarioId/${caminho}`, async (req, res) => {
    const c = await comentarioDoWorkspace(String(req.params.comentarioId), req.sessao!.workspaceId)
    const agora = new Date()
    await banco.transaction(async (tx) => {
      await tx
        .update(comentarios)
        .set({
          status,
          resolvidoPorUsuarioId: status === 'resolvido' ? req.sessao!.usuarioId : null,
          resolvidoEm: status === 'resolvido' ? agora : null,
          atualizadoEm: agora,
        })
        .where(eq(comentarios.id, c.id))
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: c.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        materialId: c.materialId,
        versaoMaterialId: c.versaoMaterialId,
        comentarioId: c.id,
        tipo,
        descricao: status === 'resolvido' ? 'Comentario resolvido' : 'Comentario reaberto',
        criadoEm: agora,
      })
    })
    res.json({
      mensagem: status === 'resolvido' ? 'Comentario resolvido.' : 'Comentario reaberto.',
    })
  })
}

import { inArray } from 'drizzle-orm'
function sqlIn(coluna: typeof respostasComentario.comentarioId, ids: string[]) {
  return inArray(coluna, ids)
}
