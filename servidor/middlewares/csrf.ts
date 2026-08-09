import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { ambiente } from '../configuracao/ambiente.js'
import { ErroHttp } from './erros.js'
import { novoToken } from '../utilitarios/seguranca.js'

export const COOKIE_CSRF = 'viztto_csrf'
const metodosSeguros = new Set(['GET', 'HEAD', 'OPTIONS'])

export const emitirCsrf: RequestHandler = (_req, res) => {
  const token = novoToken()
  res.setHeader('Cache-Control', 'private, no-store')
  res.cookie(COOKIE_CSRF, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: ambiente.COOKIE_SEGURO,
    path: '/',
  })
  res.json({ token })
}

export const protegerCsrf: RequestHandler = (req, _res, next) => {
  if (metodosSeguros.has(req.method)) return next()
  const cookie = req.cookies?.[COOKIE_CSRF] as string | undefined
  const cabecalho = req.get('x-csrf-token')
  const origem = req.get('origin')
  if (origem && origem !== ambiente.URL_APLICACAO) {
    throw new ErroHttp(403, 'Origem da requisicao nao permitida.', 'origem_invalida')
  }
  if (!cookie || !cabecalho) throw new ErroHttp(403, 'Token CSRF ausente.', 'csrf_invalido')
  const a = Buffer.from(cookie)
  const b = Buffer.from(cabecalho)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ErroHttp(403, 'Token CSRF inválido.', 'csrf_invalido')
  }
  next()
}
