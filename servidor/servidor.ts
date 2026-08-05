import { criarAplicacao } from './app.js'
import { ambiente } from './configuracao/ambiente.js'
import { pool } from './configuracao/banco.js'
import { validarDiretorioUploads } from './configuracao/upload.js'
import { executarMigrationsComTrava } from './banco/migrations.js'

async function prepararAplicacao() {
  await validarDiretorioUploads()
  if (ambiente.EXECUTAR_MIGRATIONS) {
    await executarMigrationsComTrava()
    console.log('Migrations de produção aplicadas com trava exclusiva.')
  }
}

const preparacao = prepararAplicacao()
const app = criarAplicacao(preparacao)
const servidor = app.listen(ambiente.PORTA_SERVIDOR, ambiente.HOST_SERVIDOR, () => {
  console.log('Viztto escutando.')
  console.log(`Ambiente: ${ambiente.NODE_ENV}`)
  console.log(`Host: ${ambiente.HOST_SERVIDOR}`)
  console.log(
    `Porta: ${ambiente.PORTA_SERVIDOR}${ambiente.PORT ? ' (fornecida pela plataforma)' : ''}`,
  )
})

void preparacao
  .then(() => console.log('Viztto pronto para receber requisições.'))
  .catch((erro: unknown) => {
    console.error(
      'Falha ao preparar o Viztto.',
      erro instanceof Error ? erro.message : 'erro desconhecido',
    )
    servidor.close(() => void pool.end().finally(() => process.exit(1)))
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
