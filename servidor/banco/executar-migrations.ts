import path from 'node:path'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { banco, pool } from '../configuracao/banco.js'

try {
  await migrate(banco, { migrationsFolder: path.resolve('servidor/banco/migrations') })
  console.log('Migrations aplicadas com sucesso.')
} finally {
  await pool.end()
}
