import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',
  schema: './servidor/banco/esquema/index.ts',
  out: './servidor/banco/migrations',
  dbCredentials: {
    host: process.env.BANCO_HOST ?? 'localhost',
    port: Number(process.env.BANCO_PORTA ?? 3306),
    user: process.env.BANCO_USUARIO ?? 'viztto',
    password: process.env.BANCO_SENHA ?? '',
    database: process.env.BANCO_NOME ?? 'viztto',
  },
  strict: true,
  verbose: true,
})
