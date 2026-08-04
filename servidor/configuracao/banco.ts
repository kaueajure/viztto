import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { ambiente } from './ambiente.js'
import * as esquema from '../banco/esquema/index.js'

export const pool = mysql.createPool({
  host: ambiente.BANCO_HOST,
  port: ambiente.BANCO_PORTA,
  database: ambiente.BANCO_NOME,
  user: ambiente.BANCO_USUARIO,
  password: ambiente.BANCO_SENHA,
  charset: 'utf8mb4',
  timezone: 'Z',
  connectionLimit: ambiente.NODE_ENV === 'test' ? 4 : 10,
  decimalNumbers: true,
})

export const banco = drizzle(pool, { schema: esquema, mode: 'default' })
