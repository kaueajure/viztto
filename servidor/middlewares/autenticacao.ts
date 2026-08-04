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

  const [registro] = await banco
    .select({
      sessaoId: sessoes.id,
      usuarioId: usuarios.id,
      usuarioNome: usuarios.nome,
      usuarioEmail: usuarios.email,
      workspaceId: membrosWorkspace.workspaceId,
      funcao: membrosWorkspace.funcao,
    })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuarioId))
    .innerJoin(
      membrosWorkspace,
      and(eq(membrosWorkspace.usuarioId, usuarios.id), eq(membrosWorkspace.status, 'ativo')),
    )
    .innerJoin(
      workspaces,
      and(eq(workspaces.id, membrosWorkspace.workspaceId), eq(workspaces.ativo, true)),
    )
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

  if (!registro) throw new ErroHttp(401, 'Sua sessao expirou. Entre novamente.', 'sessao_expirada')
  req.sessao = registro
  next()
}
