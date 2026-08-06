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

export const consultasRotas = Router()

consultasRotas.get('/configuracoes', async (req, res) => {
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
      })
      .from(workspaces)
      .where(eq(workspaces.id, req.sessao!.workspaceId))
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
      workspace,
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
    const [slugEmUso] = await banco
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.slug, req.body.slug), isNull(workspaces.excluidoEm)))
      .limit(1)
    if (slugEmUso && slugEmUso.id !== req.sessao!.workspaceId)
      throw new ErroHttp(409, 'Essa URL ja esta em uso.', 'slug_em_uso')
    await banco
      .update(workspaces)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(eq(workspaces.id, req.sessao!.workspaceId))
    res.json({ mensagem: 'Workspace atualizado.' })
  },
)

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
      autorNome: sql<string>`coalesce(${usuarios.nome}, 'Cliente')`.as('autorNome'),
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
      .where(and(eq(workspaces.ativo, true), isNull(workspaces.excluidoEm)))
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
