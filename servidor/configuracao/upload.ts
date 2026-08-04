import path from 'node:path'
import multer from 'multer'
import { ambiente } from './ambiente.js'

export const diretorioUploads = path.resolve(process.cwd(), ambiente.DIRETORIO_UPLOADS)
export const receberImagem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ambiente.TAMANHO_MAXIMO_IMAGEM_MB * 1024 * 1024, files: 1 },
}).single('imagem')
