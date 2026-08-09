import { constants } from 'node:fs'
import { access, mkdir, open, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import multer from 'multer'
import { ambiente, emProducao } from './ambiente.js'
import { resolverDiretorioUploads } from './caminho-upload.js'
import { diretorioDist, raizProjeto } from './caminhos.js'

export const diretorioUploads = resolverDiretorioUploads(
  raizProjeto,
  ambiente.DIRETORIO_UPLOADS,
  emProducao,
)

function armazenamentoObjetoConfigurado() {
  return Boolean(
    ambiente.ARMAZENAMENTO_OBJETO_ENDPOINT &&
    ambiente.ARMAZENAMENTO_OBJETO_BUCKET &&
    ambiente.ARMAZENAMENTO_OBJETO_ACCESS_KEY &&
    ambiente.ARMAZENAMENTO_OBJETO_SECRET_KEY,
  )
}

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
const segmentosUploads = diretorioUploads
  .split(path.sep)
  .filter(Boolean)
  .map((segmento) => segmento.toLowerCase())

if (!armazenamentoObjetoConfigurado()) {
  if (proibidos.some((proibido) => dentroDe(diretorioUploads, proibido)))
    throw new Error('DIRETORIO_UPLOADS deve apontar para um diretório persistente e isolado.')
  if (
    emProducao &&
    (dentroDe(diretorioUploads, raizProjeto) ||
      segmentosUploads.includes('public_html') ||
      segmentosUploads.includes('nodejs'))
  )
    throw new Error(
      'DIRETORIO_UPLOADS deve ficar fora de public_html, nodejs e da raiz implantada em produção.',
    )
}

export async function validarDiretorioUploads() {
  if (armazenamentoObjetoConfigurado()) return
  await mkdir(diretorioUploads, { recursive: true })
  await access(diretorioUploads, constants.R_OK | constants.W_OK)
  const teste = path.join(diretorioUploads, `.viztto-escrita-${process.pid}`)
  const arquivo = await open(teste, 'wx')
  await arquivo.close()
  await rm(teste, { force: true })
}

export async function uploadsDisponiveis() {
  if (armazenamentoObjetoConfigurado()) return true
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

export const receberImagemPortal = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
}).single('imagem')
