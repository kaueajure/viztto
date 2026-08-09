import type { ErrorRequestHandler, RequestHandler } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'

export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly codigo = 'erro_requisicao',
    public readonly detalhes?: unknown,
  ) {
    super(message)
  }
}

export const rotaNaoEncontrada: RequestHandler = (_req, _res, next) =>
  next(new ErroHttp(404, 'Rota nao encontrada.', 'rota_nao_encontrada'))

export const tratarErros: ErrorRequestHandler = (erro, req, res, _next) => {
  void _next
  if (erro instanceof ZodError) {
    res.status(422).json({
      erro: {
        codigo: 'dados_invalidos',
        mensagem: 'Revise os dados informados.',
        detalhes: erro.flatten(),
      },
    })
    return
  }
  if (erro instanceof MulterError) {
    const limite = erro.code === 'LIMIT_FILE_SIZE'
    res.status(limite ? 413 : 422).json({
      erro: {
        codigo: limite ? 'arquivo_muito_grande' : 'arquivo_invalido',
        mensagem: limite
          ? 'A imagem ultrapassa o limite permitido.'
          : 'Nao foi possivel processar o arquivo enviado.',
      },
    })
    return
  }
  const status = erro instanceof ErroHttp ? erro.status : 500
  if (status >= 500) req.log?.error({ err: erro }, 'Erro interno na requisicao')
  res.status(status).json({
    erro: {
      codigo: erro instanceof ErroHttp ? erro.codigo : 'erro_interno',
      mensagem: erro instanceof ErroHttp ? erro.message : 'Nao foi possivel concluir a operacao.',
      ...(erro instanceof ErroHttp && erro.detalhes ? { detalhes: erro.detalhes } : {}),
    },
  })
}
