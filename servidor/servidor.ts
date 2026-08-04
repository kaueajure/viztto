import { criarAplicacao } from './app.js'
import { ambiente } from './configuracao/ambiente.js'
import { pool } from './configuracao/banco.js'

const app = criarAplicacao()
const servidor = app.listen(ambiente.PORTA, () => {
  console.log(`Viztto disponivel na porta ${ambiente.PORTA}`)
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
