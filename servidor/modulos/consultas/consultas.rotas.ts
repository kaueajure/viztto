import { Router } from 'express'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import {
  atividades,
  membrosWorkspace,
  notificacoes,
  preferenciasUsuario,
  usuarios,
  workspaces,
} from '../../banco/esquema/index.js'
import { exigirAdmin, exigirFuncao } from '../../middlewares/autorizacao.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { z } from 'zod'
import { receberImagem } from '../../configuracao/upload.js'
import { garantirIdentidadePersonalizada } from '../../servicos/limites-plano.servico.js'
import { armazenarLogoWorkspace, removerArquivoSalvo } from '../../servicos/arquivo.servico.js'
import { slugReservado } from '../../utilitarios/slugs.js'
import { naoEhWorkspaceDeTeste } from '../../utilitarios/workspace-teste.js'

const perfilEntrada = z.object({ nome: z.string().trim().min(2).max(160) })
const workspaceEntrada = z.object({
  nome: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .min(2)
    .max(120),
  corPrincipal: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})
const preferenciasEntrada = z.object({
  comentarios: z.boolean(),
  alteracoes: z.boolean(),
  aprovacoes: z.boolean(),
  prazos: z.boolean(),
  email: z.boolean(),
  sistema: z.boolean(),
})

function urlLogoWorkspace(workspaceId: string, logoRelativo: string | null | undefined) {
  return logoRelativo ? `/api/portal/workspaces/${workspaceId}/logo` : null
}

export const consultasRotas = Router()

consultasRotas.get('/configuracoes', async (req, res) => {
  const workspaceId = req.sessao!.workspaceId
  const [[preferencias], [workspace]] = await Promise.all([
    banco
      .select()
      .from(preferenciasUsuario)
      .where(eq(preferenciasUsuario.usuarioId, req.sessao!.usuarioId))
      .limit(1),
    banco
      .select({
        nome: workspaces.nome,
        slug: workspaces.slug,
        corPrincipal: workspaces.corPrincipal,
        logoUrl: workspaces.logoUrl,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
  ])
  res.json({
    dado: {
      perfil: {
        nome: req.sessao!.usuarioNome,
        email: req.sessao!.usuarioEmail,
        funcao: req.sessao!.funcao,
      },
      preferencias: preferencias ?? {
        comentarios: true,
        alteracoes: true,
        aprovacoes: true,
        prazos: true,
        email: true,
        sistema: true,
      },
      workspace: workspace
        ? {
            id: workspaceId,
            nome: workspace.nome,
            slug: workspace.slug,
            corPrincipal: workspace.corPrincipal,
            logoUrl: urlLogoWorkspace(workspaceId, workspace.logoUrl),
          }
        : null,
    },
  })
})

consultasRotas.patch('/configuracoes/perfil', validarCorpo(perfilEntrada), async (req, res) => {
  await banco
    .update(usuarios)
    .set({ nome: req.body.nome, atualizadoEm: new Date() })
    .where(eq(usuarios.id, req.sessao!.usuarioId))
  res.json({ mensagem: 'Perfil atualizado.' })
})

consultasRotas.patch(
  '/configuracoes/workspace',
  exigirFuncao('gestor'),
  validarCorpo(workspaceEntrada),
  async (req, res) => {
    if (slugReservado(req.body.slug))
      throw new ErroHttp(422, 'Essa URL esta reservada. Escolha outro slug.', 'slug_reservado')
    const [slugEmUso] = await banco
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.slug, req.body.slug), isNull(workspaces.excluidoEm)))
      .limit(1)
    if (slugEmUso && slugEmUso.id !== req.sessao!.workspaceId)
      throw new ErroHttp(409, 'Essa URL ja esta em uso.', 'slug_em_uso')
    await garantirIdentidadePersonalizada(req.sessao!.workspaceId, req.body.corPrincipal)
    await banco
      .update(workspaces)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(eq(workspaces.id, req.sessao!.workspaceId))
    res.json({ mensagem: 'Workspace atualizado.' })
  },
)

consultasRotas.post(
  '/configuracoes/workspace/logo',
  exigirFuncao('gestor'),
  receberImagem,
  async (req, res) => {
    const workspaceId = req.sessao!.workspaceId
    await garantirIdentidadePersonalizada(workspaceId, '#b8ff4f', 'upload')
    if (!req.file) throw new ErroHttp(422, 'Selecione a imagem do logo.', 'arquivo_ausente')
    const [atual] = await banco
      .select({ logoUrl: workspaces.logoUrl })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)
    const salvo = await armazenarLogoWorkspace(req.file.buffer, workspaceId)
    try {
      await banco
        .update(workspaces)
        .set({ logoUrl: salvo.caminhoRelativo, atualizadoEm: new Date() })
        .where(eq(workspaces.id, workspaceId))
    } catch (erro) {
      await removerArquivoSalvo(salvo.caminhoRelativo)
      throw erro
    }
    if (atual?.logoUrl) {
      try {
        await removerArquivoSalvo(atual.logoUrl)
      } catch {
        /* logo anterior invalido — ignora */
      }
    }
    res.json({
      mensagem: 'Logo atualizado.',
      dado: { logoUrl: urlLogoWorkspace(workspaceId, salvo.caminhoRelativo) },
    })
  },
)

consultasRotas.delete('/configuracoes/workspace/logo', exigirFuncao('gestor'), async (req, res) => {
  const workspaceId = req.sessao!.workspaceId
  await garantirIdentidadePersonalizada(workspaceId, '#b8ff4f', 'remover')
  const [atual] = await banco
    .select({ logoUrl: workspaces.logoUrl })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
  await banco
    .update(workspaces)
    .set({ logoUrl: null, atualizadoEm: new Date() })
    .where(eq(workspaces.id, workspaceId))
  if (atual?.logoUrl) {
    try {
      await removerArquivoSalvo(atual.logoUrl)
    } catch {
      /* ignore */
    }
  }
  res.json({ mensagem: 'Logo removido.' })
})

consultasRotas.put(
  '/configuracoes/preferencias',
  validarCorpo(preferenciasEntrada),
  async (req, res) => {
    await banco
      .insert(preferenciasUsuario)
      .values({ usuarioId: req.sessao!.usuarioId, ...req.body, atualizadoEm: new Date() })
      .onDuplicateKeyUpdate({ set: { ...req.body, atualizadoEm: new Date() } })
    res.json({ mensagem: 'Preferencias atualizadas.' })
  },
)

consultasRotas.get('/atividades', async (req, res) => {
  const dados = await banco
    .select({
      atividade: atividades,
      autorNome: sql<string>`coalesce(
        ${usuarios.nome},
        json_unquote(json_extract(${atividades.metadados}, '$.aprovadorExternoNome')),
        json_unquote(json_extract(${atividades.metadados}, '$.solicitanteExternoNome')),
        'Cliente'
      )`.as('autorNome'),
    })
    .from(atividades)
    .leftJoin(usuarios, eq(usuarios.id, atividades.usuarioId))
    .where(eq(atividades.workspaceId, req.sessao!.workspaceId))
    .orderBy(desc(atividades.criadoEm))
    .limit(100)
  res.json({ dados })
})
consultasRotas.get('/notificacoes', async (req, res) => {
  const dados = await banco
    .select()
    .from(notificacoes)
    .where(
      and(
        eq(notificacoes.workspaceId, req.sessao!.workspaceId),
        eq(notificacoes.usuarioId, req.sessao!.usuarioId),
        isNull(notificacoes.excluidoEm),
      ),
    )
    .orderBy(desc(notificacoes.criadoEm))
    .limit(100)
  res.json({ dados })
})
consultasRotas.post('/notificacoes/:notificacaoId/ler', async (req, res) => {
  await banco
    .update(notificacoes)
    .set({ lidaEm: new Date() })
    .where(
      and(
        eq(notificacoes.id, String(req.params.notificacaoId)),
        eq(notificacoes.workspaceId, req.sessao!.workspaceId),
        eq(notificacoes.usuarioId, req.sessao!.usuarioId),
      ),
    )
  res.status(204).end()
})
consultasRotas.get('/workspaces/atual', async (req, res) => {
  const [dado] = await banco
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, req.sessao!.workspaceId))
    .limit(1)
  res.json({ dado })
})
consultasRotas.get('/workspaces', async (req, res) => {
  if (req.sessao!.admin) {
    const dados = await banco
      .select({
        id: workspaces.id,
        nome: workspaces.nome,
        slug: workspaces.slug,
        plano: workspaces.plano,
      })
      .from(workspaces)
      .where(
        and(eq(workspaces.ativo, true), isNull(workspaces.excluidoEm), naoEhWorkspaceDeTeste()),
      )
      .orderBy(workspaces.nome)
    return res.json({ dados })
  }
  const dados = await banco
    .select({
      id: workspaces.id,
      nome: workspaces.nome,
      slug: workspaces.slug,
      plano: workspaces.plano,
    })
    .from(membrosWorkspace)
    .innerJoin(workspaces, eq(workspaces.id, membrosWorkspace.workspaceId))
    .where(
      and(
        eq(membrosWorkspace.usuarioId, req.sessao!.usuarioId),
        eq(membrosWorkspace.status, 'ativo'),
        eq(workspaces.ativo, true),
        isNull(workspaces.excluidoEm),
      ),
    )
    .orderBy(workspaces.nome)
  res.json({ dados })
})
consultasRotas.get('/usuarios', exigirAdmin, async (_req, res) => {
  const dados = await banco
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      avatarUrl: usuarios.avatarUrl,
      admin: usuarios.admin,
      ativo: usuarios.ativo,
      criadoEm: usuarios.criadoEm,
    })
    .from(usuarios)
    .where(isNull(usuarios.excluidoEm))
    .orderBy(usuarios.nome)
  res.json({ dados })
})
consultasRotas.get('/usuarios/equipe', async (req, res) => {
  const dados = await banco
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      avatarUrl: usuarios.avatarUrl,
      funcao: membrosWorkspace.funcao,
      status: membrosWorkspace.status,
      entrouEm: membrosWorkspace.entrouEm,
    })
    .from(membrosWorkspace)
    .innerJoin(usuarios, eq(usuarios.id, membrosWorkspace.usuarioId))
    .where(eq(membrosWorkspace.workspaceId, req.sessao!.workspaceId))
  res.json({ dados })
})
