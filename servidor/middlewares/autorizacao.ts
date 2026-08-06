import type { RequestHandler } from 'express'
import type { FuncaoMembro } from './autenticacao.js'
import { ErroHttp } from './erros.js'

const pesos: Record<FuncaoMembro, number> = {
  visualizador: 0,
  criativo: 1,
  atendimento: 1,
  gestor: 2,
  administrador: 3,
}

export const exigirFuncao =
  (funcaoMinima: FuncaoMembro): RequestHandler =>
  (req, _res, next) => {
    if (req.sessao?.admin) return next()
    if (!req.sessao || pesos[req.sessao.funcao] < pesos[funcaoMinima]) {
      throw new ErroHttp(403, 'Voce nao possui permissao para esta acao.', 'sem_permissao')
    }
    next()
  }

export const exigirAdmin: RequestHandler = (req, _res, next) => {
  if (!req.sessao?.admin) throw new ErroHttp(403, 'Acesso restrito a administradores.', 'sem_permissao')
  next()
}
