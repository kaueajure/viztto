import path from 'node:path'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { ambiente } from '../configuracao/ambiente.js'
import { banco, pool } from '../configuracao/banco.js'

if (!ambiente.BANCO_NOME.endsWith('_testes'))
  throw new Error('Testes destrutivos exigem um banco com sufixo _testes.')
try {
  await migrate(banco, { migrationsFolder: path.resolve('servidor/banco/migrations') })
  console.log(`Banco de testes ${ambiente.BANCO_NOME} preparado.`)
} finally {
  await pool.end()
}
