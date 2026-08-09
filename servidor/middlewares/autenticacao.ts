import type { RequestHandler } from 'express'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { membrosWorkspace, sessoes, usuarios, workspaces } from '../banco/esquema/index.js'
import { ErroHttp } from './erros.js'
import { gerarHash } from '../utilitarios/seguranca.js'

export type FuncaoMembro = 'administrador' | 'gestor' | 'criativo' | 'atendimento' | 'visualizador'
export const COOKIE_SESSAO = 'viztto_sessao'

export const autenticar: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_SESSAO] as string | undefined
  if (!token) throw new ErroHttp(401, 'Entre para continuar.', 'nao_autenticado')

  const [base] = await banco
    .select({
      sessaoId: sessoes.id,
      workspaceAtivoId: sessoes.workspaceAtivoId,
      usuarioId: usuarios.id,
      usuarioNome: usuarios.nome,
      usuarioEmail: usuarios.email,
      admin: usuarios.admin,
    })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuarioId))
    .where(
      and(
        eq(sessoes.tokenHash, gerarHash(token)),
        isNull(sessoes.revogadoEm),
        gt(sessoes.expiraEm, new Date()),
        eq(usuarios.ativo, true),
        isNull(usuarios.excluidoEm),
      ),
    )
    .limit(1)

  if (!base) throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.', 'sessao_expirada')

  const membros = await banco
    .select({
      workspaceId: membrosWorkspace.workspaceId,
      funcao: membrosWorkspace.funcao,
    })
    .from(membrosWorkspace)
    .innerJoin(
      workspaces,
      and(
        eq(workspaces.id, membrosWorkspace.workspaceId),
        eq(workspaces.ativo, true),
        isNull(workspaces.excluidoEm),
      ),
    )
    .where(and(eq(membrosWorkspace.usuarioId, base.usuarioId), eq(membrosWorkspace.status, 'ativo')))

  let workspaceId = base.workspaceAtivoId ?? membros[0]?.workspaceId ?? null
  if (!workspaceId && base.admin) {
    const [primeiro] = await banco
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.ativo, true), isNull(workspaces.excluidoEm)))
      .limit(1)
    workspaceId = primeiro?.id ?? null
  }
  if (!workspaceId) throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.', 'sessao_expirada')

  const membro = membros.find((item) => item.workspaceId === workspaceId)
  if (!membro && !base.admin) {
    throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.', 'sessao_expirada')
  }

  const [workspace] = await banco
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ativo, true), isNull(workspaces.excluidoEm)))
    .limit(1)
  if (!workspace) throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.', 'sessao_expirada')

  if (base.workspaceAtivoId !== workspaceId) {
    await banco
      .update(sessoes)
      .set({ workspaceAtivoId: workspaceId })
      .where(eq(sessoes.id, base.sessaoId))
  }

  req.sessao = {
    sessaoId: base.sessaoId,
    usuarioId: base.usuarioId,
    usuarioNome: base.usuarioNome,
    usuarioEmail: base.usuarioEmail,
    workspaceId,
    funcao: base.admin ? 'administrador' : (membro?.funcao ?? 'administrador'),
    admin: base.admin,
  }
  next()
}
