import { constants } from 'node:fs'
import { access, mkdir, open, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import multer from 'multer'
import { ambiente } from './ambiente.js'
import { diretorioDist, raizProjeto } from './caminhos.js'

export const diretorioUploads = path.resolve(raizProjeto, ambiente.DIRETORIO_UPLOADS)

function dentroDe(caminho: string, base: string) {
  const relativo = path.relative(base, caminho)
  return relativo === '' || (!relativo.startsWith('..') && !path.isAbsolute(relativo))
}

const proibidos = [
  diretorioDist,
  path.join(raizProjeto, 'build-servidor'),
  path.join(raizProjeto, 'node_modules'),
  os.tmpdir(),
]
if (proibidos.some((proibido) => dentroDe(diretorioUploads, proibido)))
  throw new Error('DIRETORIO_UPLOADS deve apontar para um diretório persistente e isolado.')

export async function validarDiretorioUploads() {
  await mkdir(diretorioUploads, { recursive: true })
  await access(diretorioUploads, constants.R_OK | constants.W_OK)
  const teste = path.join(diretorioUploads, `.viztto-escrita-${process.pid}`)
  const arquivo = await open(teste, 'wx')
  await arquivo.close()
  await rm(teste, { force: true })
}

export async function uploadsDisponiveis() {
  try {
    await access(diretorioUploads, constants.R_OK | constants.W_OK)
    return true
  } catch {
    return false
  }
}
export const receberArquivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ambiente.TAMANHO_MAXIMO_ARQUIVO_MB * 1024 * 1024, files: 1 },
}).single('imagem')

export const receberImagem = receberArquivo
