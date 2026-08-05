import { migrate } from 'drizzle-orm/mysql2/migrator'
import type { RowDataPacket } from 'mysql2'
import { banco, pool } from '../configuracao/banco.js'
import { diretorioMigrations } from '../configuracao/caminhos.js'

const nomeTrava = 'viztto_migrations_producao'
type ResultadoTrava = RowDataPacket & { adquirida: number }

export async function executarMigrationsComTrava() {
  const conexao = await pool.getConnection()
  try {
    const [linhas] = await conexao.query<ResultadoTrava[]>(
      'SELECT GET_LOCK(?, 30) AS adquirida',
      [nomeTrava],
    )
    if (linhas[0]?.adquirida !== 1)
      throw new Error('Não foi possível adquirir a trava de migrations dentro do prazo.')
    await migrate(banco, { migrationsFolder: diretorioMigrations })
  } finally {
    try {
      await conexao.query('SELECT RELEASE_LOCK(?)', [nomeTrava])
    } finally {
      conexao.release()
    }
  }
}
