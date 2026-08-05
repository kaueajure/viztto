import { criarAplicacao } from './app.js'
import { ambiente } from './configuracao/ambiente.js'
import { pool } from './configuracao/banco.js'
import { validarDiretorioUploads } from './configuracao/upload.js'
import { executarMigrationsComTrava } from './banco/migrations.js'

await validarDiretorioUploads()
if (ambiente.EXECUTAR_MIGRATIONS) {
  await executarMigrationsComTrava()
  console.log('Migrations de produção aplicadas com trava exclusiva.')
}

const app = criarAplicacao()
const servidor = app.listen(ambiente.PORTA_SERVIDOR, ambiente.HOST_SERVIDOR, () => {
  console.log('Viztto iniciado.')
  console.log(`Ambiente: ${ambiente.NODE_ENV}`)
  console.log(`Host: ${ambiente.HOST_SERVIDOR}`)
  console.log(`Porta: ${ambiente.PORT ? 'fornecida pela plataforma' : ambiente.PORTA_SERVIDOR}`)
})

async function encerrar(sinal: string) {
  console.log(`Encerrando por ${sinal}`)
  servidor.close(async () => {
    await pool.end()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.once('SIGINT', () => void encerrar('SIGINT'))
process.once('SIGTERM', () => void encerrar('SIGTERM'))
