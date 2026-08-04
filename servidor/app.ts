import path from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { ambiente, emProducao } from './configuracao/ambiente.js'
import { autenticar } from './middlewares/autenticacao.js'
import { emitirCsrf, protegerCsrf } from './middlewares/csrf.js'
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js'
import { autenticacaoRotas } from './modulos/autenticacao/autenticacao.rotas.js'
import { clientesRotas } from './modulos/clientes/clientes.rotas.js'
import { projetosRotas } from './modulos/projetos/projetos.rotas.js'
import { materiaisRotas } from './modulos/materiais/materiais.rotas.js'
import { comentariosRotas } from './modulos/comentarios/comentarios.rotas.js'
import { aprovacoesRotas } from './modulos/aprovacoes/aprovacoes.rotas.js'
import { consultasRotas } from './modulos/consultas/consultas.rotas.js'
import { arquivosRotas } from './modulos/arquivos/arquivos.rotas.js'

export function criarAplicacao() {
  const app = express()
  if (ambiente.CONFIAR_PROXY) app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(
    pinoHttp({
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.x-csrf-token',
        'res.headers.set-cookie',
        'req.body.senha',
        'req.body.token',
      ],
    }),
  )
  app.use(
    helmet({
      contentSecurityPolicy: emProducao ? undefined : false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  )
  if (!emProducao)
    app.use(
      cors({
        origin: ambiente.URL_APLICACAO,
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      }),
    )
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '32kb' }))

  app.get('/api/saude', (_req, res) =>
    res.json({ estado: 'ok', horario: new Date().toISOString() }),
  )
  app.get('/api/autenticacao/csrf', emitirCsrf)
  app.use('/api', protegerCsrf)
  app.use('/api/autenticacao', autenticacaoRotas)
  app.use('/api/clientes', autenticar, clientesRotas)
  app.use('/api/projetos', autenticar, projetosRotas)
  app.use('/api/materiais', autenticar, materiaisRotas)
  app.use('/api', autenticar, comentariosRotas)
  app.use('/api', autenticar, aprovacoesRotas)
  app.use('/api', autenticar, consultasRotas)
  app.use('/arquivos', autenticar, arquivosRotas)

  if (emProducao) {
    const dist = path.resolve(process.cwd(), 'dist')
    app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }))
    app.get('/{*caminho}', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/arquivos')) return next()
      res.sendFile(path.join(dist, 'index.html'))
    })
  }
  app.use(rotaNaoEncontrada)
  app.use(tratarErros)
  return app
}
