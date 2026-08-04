import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

export const validarCorpo =
  (esquema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = esquema.parse(req.body)
    next()
  }
