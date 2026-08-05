import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const arquivoServidor = path.join(raiz, 'build-servidor', 'servidor', 'servidor.js')

if (!existsSync(arquivoServidor)) {
  console.error('Backend compilado não encontrado.')
  console.error('Execute "npm run build" antes de iniciar o Viztto.')
  process.exit(1)
}

try {
  createRequire(import.meta.url)(arquivoServidor)
} catch (erro) {
  console.error('Falha ao iniciar o Viztto.', erro instanceof Error ? erro.message : erro)
  process.exit(1)
}
