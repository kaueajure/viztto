import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const raizProjeto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const artefatosObrigatorios = [
  path.join(raizProjeto, 'dist', 'index.html'),
  path.join(raizProjeto, 'build-servidor', 'servidor', 'servidor.js'),
  path.join(raizProjeto, 'servidor', 'banco', 'migrations'),
]
