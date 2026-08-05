import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function localizarRaiz(inicio: string) {
  let atual = inicio
  while (true) {
    if (existsSync(path.join(atual, 'package.json'))) return atual
    const pai = path.dirname(atual)
    if (pai === atual) throw new Error('Não foi possível localizar a raiz do projeto Viztto.')
    atual = pai
  }
}

export const raizProjeto = localizarRaiz(path.dirname(fileURLToPath(import.meta.url)))
export const diretorioDist = path.join(raizProjeto, 'dist')
export const diretorioMigrations = path.join(raizProjeto, 'servidor', 'banco', 'migrations')
