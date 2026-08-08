import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { fileTypeFromBuffer } from 'file-type'
import type { Response } from 'express'
import sharp from 'sharp'
import { ambiente } from '../configuracao/ambiente.js'
import { diretorioUploads } from '../configuracao/upload.js'
import { ErroHttp } from '../middlewares/erros.js'

const permitidos = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

let clienteS3: S3Client | null = null

export function armazenamentoObjetoAtivo() {
  return Boolean(
    ambiente.ARMAZENAMENTO_OBJETO_ENDPOINT &&
      ambiente.ARMAZENAMENTO_OBJETO_BUCKET &&
      ambiente.ARMAZENAMENTO_OBJETO_ACCESS_KEY &&
      ambiente.ARMAZENAMENTO_OBJETO_SECRET_KEY,
  )
}

function obterClienteS3() {
  if (!armazenamentoObjetoAtivo())
    throw new ErroHttp(503, 'Armazenamento de objetos nao configurado.', 'armazenamento_nao_configurado')
  if (!clienteS3) {
    clienteS3 = new S3Client({
      region: ambiente.ARMAZENAMENTO_OBJETO_REGIAO || 'auto',
      endpoint: ambiente.ARMAZENAMENTO_OBJETO_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: ambiente.ARMAZENAMENTO_OBJETO_ACCESS_KEY!,
        secretAccessKey: ambiente.ARMAZENAMENTO_OBJETO_SECRET_KEY!,
      },
    })
  }
  return clienteS3
}

function validarCaminhoRelativo(caminhoRelativo: string) {
  const normalizado = caminhoRelativo.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalizado || normalizado.includes('..'))
    throw new ErroHttp(400, 'Caminho de arquivo invalido.', 'arquivo_invalido')
  return normalizado
}

async function gravarBytes(caminhoRelativo: string, buffer: Buffer, mimeType: string) {
  const chave = validarCaminhoRelativo(caminhoRelativo)
  if (armazenamentoObjetoAtivo()) {
    await obterClienteS3().send(
      new PutObjectCommand({
        Bucket: ambiente.ARMAZENAMENTO_OBJETO_BUCKET,
        Key: chave,
        Body: buffer,
        ContentType: mimeType,
      }),
    )
    return
  }
  const destino = path.join(diretorioUploads, ...chave.split('/'))
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, buffer, { flag: 'wx' })
}

export async function lerBytesArquivo(caminhoRelativo: string) {
  const chave = validarCaminhoRelativo(caminhoRelativo)
  if (armazenamentoObjetoAtivo()) {
    const resposta = await obterClienteS3().send(
      new GetObjectCommand({
        Bucket: ambiente.ARMAZENAMENTO_OBJETO_BUCKET,
        Key: chave,
      }),
    )
    const bytes = await resposta.Body?.transformToByteArray()
    if (!bytes) throw new ErroHttp(404, 'Arquivo nao encontrado.', 'arquivo_nao_encontrado')
    return Buffer.from(bytes)
  }
  const absoluto = absolutoDoCaminhoRelativo(chave)
  await access(absoluto)
  const { readFile } = await import('node:fs/promises')
  return readFile(absoluto)
}

export async function enviarArquivoResposta(
  res: Response,
  caminhoRelativo: string,
  mimeType: string,
) {
  const chave = validarCaminhoRelativo(caminhoRelativo)
  res.type(mimeType).setHeader('Cache-Control', 'private, max-age=3600')
  if (armazenamentoObjetoAtivo()) {
    const bytes = await lerBytesArquivo(chave)
    res.send(bytes)
    return
  }
  const absoluto = absolutoDoCaminhoRelativo(chave)
  await access(absoluto)
  createReadStream(absoluto).pipe(res)
}

export async function armazenarImagem(
  buffer: Buffer,
  nomeOriginal: string,
  contexto: { workspaceId: string; materialId: string; tipo: string },
) {
  const tipo = await fileTypeFromBuffer(buffer)
  if (!tipo || !permitidos.has(tipo.mime)) {
    throw new ErroHttp(415, 'Use JPEG, PNG, WebP, PDF, MP4, WebM ou MOV.', 'arquivo_invalido')
  }
  const corresponde =
    (contexto.tipo === 'imagem' && tipo.mime.startsWith('image/')) ||
    (contexto.tipo === 'video' && tipo.mime.startsWith('video/')) ||
    (contexto.tipo === 'pdf' && tipo.mime === 'application/pdf')
  if (!corresponde)
    throw new ErroHttp(
      415,
      'O conteudo do arquivo nao corresponde ao formato selecionado.',
      'arquivo_invalido',
    )
  const nomeArmazenado = `${randomUUID()}.${tipo.ext}`
  const caminhoRelativo = path.posix.join(
    'workspaces',
    contexto.workspaceId,
    'materiais',
    contexto.materialId,
    'versoes',
    nomeArmazenado,
  )
  const metadados = tipo.mime.startsWith('image/')
    ? await sharp(buffer, { failOn: 'error' }).metadata()
    : { width: undefined, height: undefined }
  await gravarBytes(caminhoRelativo, buffer, tipo.mime)
  return {
    caminhoRelativo,
    registro: {
      nomeOriginal: path.basename(nomeOriginal).slice(0, 255),
      nomeArmazenado,
      caminhoRelativo,
      mimeType: tipo.mime,
      extensao: tipo.ext,
      tamanhoBytes: buffer.length,
      largura: metadados.width,
      altura: metadados.height,
      checksum: createHash('sha256').update(buffer).digest('hex'),
    },
  }
}

const logosPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Salva logo do workspace (JPEG/PNG/WebP) e devolve o caminho relativo. */
export async function armazenarLogoWorkspace(buffer: Buffer, workspaceId: string) {
  const tipo = await fileTypeFromBuffer(buffer)
  if (!tipo || !logosPermitidos.has(tipo.mime))
    throw new ErroHttp(415, 'Use JPEG, PNG ou WebP para o logo.', 'arquivo_invalido')
  const nomeArmazenado = `${randomUUID()}.${tipo.ext}`
  const caminhoRelativo = path.posix.join('workspaces', workspaceId, 'logo', nomeArmazenado)
  await gravarBytes(caminhoRelativo, buffer, tipo.mime)
  return { caminhoRelativo, mimeType: tipo.mime }
}

/** Remove por caminho relativo (local ou objeto). */
export async function removerArquivoSalvo(caminhoRelativo: string) {
  const chave = validarCaminhoRelativo(caminhoRelativo)
  if (armazenamentoObjetoAtivo()) {
    await obterClienteS3().send(
      new DeleteObjectCommand({
        Bucket: ambiente.ARMAZENAMENTO_OBJETO_BUCKET,
        Key: chave,
      }),
    )
    return
  }
  const absoluto = absolutoDoCaminhoRelativo(chave)
  await rm(absoluto, { force: true })
}

export function absolutoDoCaminhoRelativo(caminhoRelativo: string) {
  const chave = validarCaminhoRelativo(caminhoRelativo)
  const absoluto = path.resolve(diretorioUploads, ...chave.split('/'))
  if (!absoluto.startsWith(`${diretorioUploads}${path.sep}`))
    throw new ErroHttp(400, 'Caminho de arquivo invalido.', 'arquivo_invalido')
  return absoluto
}
