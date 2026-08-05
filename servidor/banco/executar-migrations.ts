import { pool } from '../configuracao/banco.js'
import { executarMigrationsComTrava } from './migrations.js'

try {
  await executarMigrationsComTrava()
  console.log('Migrations aplicadas com sucesso.')
} finally {
  await pool.end()
}
