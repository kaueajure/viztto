import { createHash, randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { diretorioUploads } from '../configuracao/upload.js'
import { ErroHttp } from '../middlewares/erros.js'

const permitidos = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function armazenarImagem(
  buffer: Buffer,
  nomeOriginal: string,
  contexto: { workspaceId: string; materialId: string },
) {
  const tipo = await fileTypeFromBuffer(buffer)
  if (!tipo || !permitidos.has(tipo.mime)) {
    throw new ErroHttp(415, 'Use uma imagem JPEG, PNG ou WebP valida.', 'imagem_invalida')
  }
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
  const metadados = await sharp(buffer, { failOn: 'error' }).metadata()
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
