import { Router } from 'express'
import { and, count, desc, eq, isNull, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { receberImagem } from '../../configuracao/upload.js'
import {
  atividades,
  arquivos,
  comentarios,
  materiais,
  projetos,
  versoesMaterial,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { consultaPaginada, paginar } from '../../utilitarios/paginacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { armazenarImagem, removerArquivoSalvo } from '../../servicos/arquivo.servico.js'
import { notificarClienteProjetoAlterado } from '../../servicos/notificar-cliente-projeto.servico.js'

const novoMaterial = z.object({
  projetoId: z.string().uuid(),
  nome: z.string().trim().min(2).max(220),
  tipo: z.enum(['imagem', 'video', 'pdf', 'apresentacao', 'pagina_web']).default('imagem'),
})
const novaVersao = z.object({
  nome: z.string().trim().min(1).max(180),
  descricao: z.string().max(5000).optional(),
  copiarPendencias: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

export const materiaisRotas = Router()

async function obterMaterial(materialId: string, workspaceId: string) {
  const [material] = await banco
    .select()
    .from(materiais)
    .where(
      and(
        eq(materiais.id, materialId),
        eq(materiais.workspaceId, workspaceId),
        isNull(materiais.excluidoEm),
      ),
    )
    .limit(1)
  if (!material) throw new ErroHttp(404, 'Material nao encontrado.', 'material_nao_encontrado')
  return material
}

materiaisRotas.get('/', async (req, res) => {
  const q = consultaPaginada.parse(req.query)
  const workspaceId = req.sessao!.workspaceId
  const filtro = and(
    eq(materiais.workspaceId, workspaceId),
    isNull(materiais.excluidoEm),
    q.busca ? like(materiais.nome, `%${q.busca}%`) : undefined,
  )
  const [[c], dados] = await Promise.all([
    banco.select({ total: count() }).from(materiais).where(filtro),
    banco
      .select({
        material: materiais,
        numeroVersao: versoesMaterial.numero,
        imagemUrl: arquivos.caminhoRelativo,
        comentarios: sql<number>`count(distinct ${comentarios.id})`,
        pendencias: sql<number>`sum(case when ${comentarios.status} = 'aberto' and ${comentarios.excluidoEm} is null then 1 else 0 end)`,
      })
      .from(materiais)
      .leftJoin(versoesMaterial, eq(versoesMaterial.id, materiais.versaoAtualId))
      .leftJoin(arquivos, eq(arquivos.id, versoesMaterial.arquivoId))
      .leftJoin(comentarios, eq(comentarios.materialId, materiais.id))
      .where(filtro)
      .groupBy(materiais.id, versoesMaterial.numero, arquivos.caminhoRelativo)
      .orderBy(desc(materiais.atualizadoEm))
      .limit(q.porPagina)
      .offset((q.pagina - 1) * q.porPagina),
  ])
  res.json(paginar(q.pagina, q.porPagina, c?.total ?? 0, dados))
})

materiaisRotas.post('/', exigirFuncao('criativo'), receberImagem, async (req, res) => {
  const corpo = novoMaterial.parse(req.body)
  const [projeto] = await banco
    .select({ id: projetos.id })
    .from(projetos)
    .where(
      and(
        eq(projetos.id, corpo.projetoId),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
    .limit(1)
  if (!projeto) throw new ErroHttp(422, 'Projeto invalido para este workspace.', 'projeto_invalido')
  if (corpo.tipo !== 'imagem')
    throw new ErroHttp(
      422,
      'A criacao completa desta etapa aceita somente materiais de imagem.',
      'formato_nao_suportado',
    )
  if (!req.file) throw new ErroHttp(422, 'Selecione a imagem do primeiro envio.', 'imagem_ausente')
  const id = novoId()
  const versaoId = novoId()
  const arquivoId = novoId()
  const agora = new Date()
  const salvo = await armazenarImagem(req.file.buffer, req.file.originalname, {
    workspaceId: req.sessao!.workspaceId,
    materialId: id,
  })
  try {
    await banco.transaction(async (tx) => {
      await tx.insert(materiais).values({
        id,
        workspaceId: req.sessao!.workspaceId,
        projetoId: corpo.projetoId,
        nome: corpo.nome,
        tipo: corpo.tipo,
        status: 'em_revisao',
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      await tx.insert(arquivos).values({
        id: arquivoId,
        workspaceId: req.sessao!.workspaceId,
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        ...salvo.registro,
      })
      await tx.insert(versoesMaterial).values({
        id: versaoId,
        materialId: id,
        arquivoId,
        numero: 1,
        nome: 'Primeiro envio',
        atual: true,
        criadaPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
      })
      await tx
        .update(materiais)
        .set({ versaoAtualId: versaoId })
        .where(eq(materiais.id, id))
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: req.sessao!.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: corpo.projetoId,
        materialId: id,
        versaoMaterialId: versaoId,
        tipo: 'material_criado',
        descricao: `Material ${corpo.nome} criado com a primeira versao`,
        criadoEm: agora,
      })
    })
  } catch (erro) {
    await removerArquivoSalvo(salvo.caminhoAbsoluto)
    throw erro
  }
  await notificarClienteProjetoAlterado({
    projetoId: corpo.projetoId,
    workspaceId: req.sessao!.workspaceId,
    resumo: `${req.sessao!.usuarioNome} adicionou o material "${corpo.nome}".`,
  })
  res.status(201).json({ dado: { id, versaoId } })
})

materiaisRotas.get('/:materialId', async (req, res) => {
  const material = await obterMaterial(String(req.params.materialId), req.sessao!.workspaceId)
  const [versoes, totais] = await Promise.all([
    banco
      .select({ versao: versoesMaterial, arquivo: arquivos })
      .from(versoesMaterial)
      .innerJoin(arquivos, eq(arquivos.id, versoesMaterial.arquivoId))
      .where(and(eq(versoesMaterial.materialId, material.id), isNull(versoesMaterial.excluidoEm)))
      .orderBy(desc(versoesMaterial.numero)),
    banco
      .select({
        comentarios: count(),
        pendencias: sql<number>`sum(case when ${comentarios.status} = 'aberto' and ${comentarios.excluidoEm} is null then 1 else 0 end)`,
      })
      .from(comentarios)
      .where(eq(comentarios.materialId, material.id)),
  ])
  res.json({ dado: { material, versoes, totais: totais[0] ?? { comentarios: 0, pendencias: 0 } } })
})

materiaisRotas.patch(
  '/:materialId',
  exigirFuncao('criativo'),
  validarCorpo(novoMaterial.partial()),
  async (req, res) => {
    await obterMaterial(String(req.params.materialId), req.sessao!.workspaceId)
    await banco
      .update(materiais)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(eq(materiais.id, String(req.params.materialId)))
    res.json({ mensagem: 'Material atualizado.' })
  },
)

materiaisRotas.post(
  '/:materialId/versoes',
  exigirFuncao('criativo'),
  receberImagem,
  async (req, res) => {
    const corpo = novaVersao.parse(req.body)
    const material = await obterMaterial(String(req.params.materialId), req.sessao!.workspaceId)
    if (material.tipo !== 'imagem')
      throw new ErroHttp(
        422,
        'O upload desta etapa aceita somente imagens.',
        'formato_nao_suportado',
      )
    if (!req.file) throw new ErroHttp(422, 'Selecione uma imagem.', 'imagem_ausente')
    const salvo = await armazenarImagem(req.file.buffer, req.file.originalname, {
      workspaceId: material.workspaceId,
      materialId: material.id,
    })
    const arquivoId = novoId()
    const versaoId = novoId()
    const agora = new Date()
    try {
      await banco.transaction(async (tx) => {
      const [ultima] = await tx
        .select({ numero: versoesMaterial.numero })
        .from(versoesMaterial)
        .where(eq(versoesMaterial.materialId, material.id))
        .orderBy(desc(versoesMaterial.numero))
        .limit(1)
      const numero = (ultima?.numero ?? 0) + 1
      await tx.insert(arquivos).values({
        id: arquivoId,
        workspaceId: material.workspaceId,
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        ...salvo.registro,
      })
      await tx
        .update(versoesMaterial)
        .set({ atual: false })
        .where(eq(versoesMaterial.materialId, material.id))
      await tx.insert(versoesMaterial).values({
        id: versaoId,
        materialId: material.id,
        arquivoId,
        numero,
        nome: corpo.nome,
        descricao: corpo.descricao,
        atual: true,
        criadaPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
      })
      if (corpo.copiarPendencias && material.versaoAtualId) {
        const pendentes = await tx
          .select()
          .from(comentarios)
          .where(
            and(
              eq(comentarios.versaoMaterialId, material.versaoAtualId),
              eq(comentarios.status, 'aberto'),
              isNull(comentarios.excluidoEm),
            ),
          )
        if (pendentes.length)
          await tx.insert(comentarios).values(
            pendentes.map((c) => ({
              id: novoId(),
              workspaceId: c.workspaceId,
              materialId: c.materialId,
              versaoMaterialId: versaoId,
              usuarioId: c.usuarioId,
              comentarioOrigemId: c.id,
              texto: c.texto,
              posicaoX: c.posicaoX,
              posicaoY: c.posicaoY,
              status: 'aberto' as const,
              criadoEm: agora,
              atualizadoEm: agora,
            })),
          )
      }
      await tx
        .update(materiais)
        .set({ versaoAtualId: versaoId, status: 'em_revisao', atualizadoEm: agora })
        .where(eq(materiais.id, material.id))
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: material.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: material.projetoId,
        materialId: material.id,
        versaoMaterialId: versaoId,
        tipo: 'versao_publicada',
        descricao: `Nova versao publicada: ${corpo.nome}`,
        criadoEm: agora,
      })
      })
    } catch (erro) {
      await removerArquivoSalvo(salvo.caminhoAbsoluto)
      throw erro
    }
    await notificarClienteProjetoAlterado({
      projetoId: material.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} publicou uma nova versao do material "${material.nome}".`,
    })
    res.status(201).json({ dado: { id: versaoId } })
  },
)
