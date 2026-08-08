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

const logosPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Salva logo do workspace (JPEG/PNG/WebP) e devolve o caminho relativo. */
export async function armazenarLogoWorkspace(buffer: Buffer, workspaceId: string) {
  const tipo = await fileTypeFromBuffer(buffer)
  if (!tipo || !logosPermitidos.has(tipo.mime))
    throw new ErroHttp(415, 'Use JPEG, PNG ou WebP para o logo.', 'arquivo_invalido')
  const nomeArmazenado = `${randomUUID()}.${tipo.ext}`
  const caminhoRelativo = path.posix.join('workspaces', workspaceId, 'logo', nomeArmazenado)
  const destino = path.join(diretorioUploads, ...caminhoRelativo.split('/'))
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, buffer, { flag: 'wx' })
  return { caminhoAbsoluto: destino, caminhoRelativo, mimeType: tipo.mime }
}

export async function removerArquivoSalvo(caminhoAbsoluto: string) {
  await rm(caminhoAbsoluto, { force: true })
}

export function absolutoDoCaminhoRelativo(caminhoRelativo: string) {
  const absoluto = path.resolve(diretorioUploads, ...caminhoRelativo.split('/'))
  if (!absoluto.startsWith(`${diretorioUploads}${path.sep}`))
    throw new ErroHttp(400, 'Caminho de arquivo invalido.', 'arquivo_invalido')
  return absoluto
}
