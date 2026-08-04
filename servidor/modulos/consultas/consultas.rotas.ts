import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import {
  atividades,
  membrosWorkspace,
  notificacoes,
  usuarios,
  workspaces,
} from '../../banco/esquema/index.js'

export const consultasRotas = Router()

consultasRotas.get('/atividades', async (req, res) => {
  const dados = await banco
    .select({ atividade: atividades, autorNome: usuarios.nome })
    .from(atividades)
    .innerJoin(usuarios, eq(usuarios.id, atividades.usuarioId))
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
