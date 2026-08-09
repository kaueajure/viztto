import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { artefatosObrigatorios, raizProjeto } from './caminhos-projeto.mjs'

const obrigatorias = [
  'NODE_ENV',
  'BANCO_HOST',
  'BANCO_PORTA',
  'BANCO_NOME',
  'BANCO_USUARIO',
  'BANCO_SENHA',
  'SEGREDO_SESSAO',
  'URL_APLICACAO',
  'EMAIL_HOST',
  'EMAIL_USUARIO',
  'EMAIL_SENHA',
]

const npm = process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/)?.[1] ?? 'não informado'

const uploadsConfigurado =
  process.env.DIRETORIO_UPLOADS ||
  (process.env.NODE_ENV === 'production' ? 'uploads' : path.join('.', 'uploads'))
const uploadsResolvido = path.isAbsolute(uploadsConfigurado)
  ? path.normalize(uploadsConfigurado)
  : process.env.NODE_ENV === 'production' &&
      uploadsConfigurado !== '..' &&
      !uploadsConfigurado.startsWith(`..${path.sep}`)
    ? path.resolve(path.dirname(raizProjeto), uploadsConfigurado)
    : path.resolve(raizProjeto, uploadsConfigurado)
const uploadsForaDaRaiz = path.relative(raizProjeto, uploadsResolvido).startsWith('..')

console.log(`Node.js: ${process.version}`)
console.log(`npm: ${npm}`)
console.log(`Sistema: ${os.platform()} ${os.arch()}`)
console.log(`Diretório atual: ${process.cwd()}`)
console.log(`Raiz detectada: ${raizProjeto}`)
console.log(`Uploads resolvidos: ${uploadsResolvido}`)
console.log(`Uploads fora da raiz implantada: ${uploadsForaDaRaiz ? 'sim' : 'nao'}`)
console.log(
  `package.json: ${existsSync(path.join(raizProjeto, 'package.json')) ? 'presente' : 'ausente'}`,
)
for (const artefato of artefatosObrigatorios) {
  console.log(
    `${path.relative(raizProjeto, artefato)}: ${existsSync(artefato) ? 'presente' : 'ausente'}`,
  )
}
console.log('Variáveis obrigatórias:')
for (const nome of obrigatorias)
  console.log(`- ${nome}: ${process.env[nome] ? 'presente' : 'ausente'}`)
console.log(`- PORT/PORTA: ${process.env.PORT || process.env.PORTA ? 'presente' : 'fallback 3000'}`)
