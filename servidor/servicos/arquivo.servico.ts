import { createHash, randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
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
  const destino = path.join(diretorioUploads, ...caminhoRelativo.split('/'))
  const metadados = tipo.mime.startsWith('image/')
    ? await sharp(buffer, { failOn: 'error' }).metadata()
    : { width: undefined, height: undefined }
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, buffer, { flag: 'wx' })
  return {
    caminhoAbsoluto: destino,
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

export async function removerArquivoSalvo(caminhoAbsoluto: string) {
  await rm(caminhoAbsoluto, { force: true })
}
