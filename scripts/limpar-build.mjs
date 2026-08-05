import { rm } from 'node:fs/promises'
import path from 'node:path'
import { raizProjeto } from './caminhos-projeto.mjs'

for (const diretorio of ['dist', 'build-servidor']) {
  await rm(path.join(raizProjeto, diretorio), { recursive: true, force: true })
}

console.log('Artefatos anteriores removidos.')
