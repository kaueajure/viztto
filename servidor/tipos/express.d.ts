import type { FuncaoMembro } from '../middlewares/autenticacao.js'

declare global {
  namespace Express {
    interface Request {
      sessao?: {
        sessaoId: string
        usuarioId: string
        usuarioNome: string
        usuarioEmail: string
        workspaceId: string
        funcao: FuncaoMembro
      }
    }
  }
}

export {}
