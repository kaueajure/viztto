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
  'DIRETORIO_UPLOADS',
]

const npm = process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/)?.[1] ?? 'não informado'

console.log(`Node.js: ${process.version}`)
console.log(`npm: ${npm}`)
console.log(`Sistema: ${os.platform()} ${os.arch()}`)
console.log(`Diretório atual: ${process.cwd()}`)
console.log(`Raiz detectada: ${raizProjeto}`)
console.log(`package.json: ${existsSync(path.join(raizProjeto, 'package.json')) ? 'presente' : 'ausente'}`)
for (const artefato of artefatosObrigatorios) {
  console.log(`${path.relative(raizProjeto, artefato)}: ${existsSync(artefato) ? 'presente' : 'ausente'}`)
}
console.log('Variáveis obrigatórias:')
for (const nome of obrigatorias) console.log(`- ${nome}: ${process.env[nome] ? 'presente' : 'ausente'}`)
console.log(`- PORT/PORTA: ${process.env.PORT || process.env.PORTA ? 'presente' : 'fallback 3000'}`)
