import 'dotenv/config'
import { z } from 'zod'

const booleano = z
  .enum(['true', 'false'])
  .default('false')
  .transform((valor) => valor === 'true')

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORTA: z.coerce.number().int().positive().default(3000),
  BANCO_HOST: z.string().min(1).default('localhost'),
  BANCO_PORTA: z.coerce.number().int().positive().default(3306),
  BANCO_NOME: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .default('viztto'),
  BANCO_USUARIO: z.string().min(1).default('viztto'),
  BANCO_SENHA: z.string().default(''),
  SEGREDO_SESSAO: z.string().min(32),
  URL_APLICACAO: z.string().url().default('http://localhost:3000'),
  DIRETORIO_UPLOADS: z.string().default('./uploads'),
  TAMANHO_MAXIMO_IMAGEM_MB: z.coerce.number().positive().max(50).default(15),
  COOKIE_SEGURO: booleano,
  CONFIAR_PROXY: booleano,
})

const resultado = esquema.safeParse(process.env)
if (!resultado.success) {
  const mensagens = resultado.error.issues.map((erro) => `${erro.path.join('.')}: ${erro.message}`)
  throw new Error(`Variaveis de ambiente invalidas:\n${mensagens.join('\n')}`)
}

export const ambiente = resultado.data
export const emProducao = ambiente.NODE_ENV === 'production'
