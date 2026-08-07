import 'dotenv/config'
import { z } from 'zod'

const booleano = (padrao: boolean) =>
  z
    .enum(['true', 'false'])
    .default(String(padrao) as 'true' | 'false')
    .transform((valor) => valor === 'true')

const portaOpcional = z.preprocess(
  (valor) => (valor === '' || valor === undefined ? undefined : valor),
  z.coerce.number().int().min(1).max(65535).optional(),
)

const segredoOpcional = (minimo: number) =>
  z.preprocess(
    (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor),
    z.string().min(minimo).optional(),
  )

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: portaOpcional,
  PORTA: portaOpcional,
  BANCO_HOST: z.string().min(1),
  BANCO_PORTA: z.coerce.number().int().positive().default(3306),
  BANCO_NOME: z.string().regex(/^[a-z0-9_]+$/),
  BANCO_USUARIO: z.string().min(1),
  BANCO_SENHA: z.string().default(''),
  SEGREDO_SESSAO: z.string().min(32),
  URL_APLICACAO: z.string().url().optional(),
  DIRETORIO_UPLOADS: z.string().default('./uploads'),
  TAMANHO_MAXIMO_IMAGEM_MB: z.coerce.number().positive().max(50).default(15),
  TAMANHO_MAXIMO_ARQUIVO_MB: z.coerce.number().positive().max(500).default(100),
  COOKIE_SEGURO: booleano(false),
  CONFIAR_PROXY: booleano(false),
  EXECUTAR_MIGRATIONS: booleano(false),
  EMAIL_HOST: z.string().min(1).optional(),
  EMAIL_PORTA: z.coerce.number().int().min(1).max(65535).default(465),
  EMAIL_USUARIO: z.string().min(1).optional(),
  EMAIL_SENHA: z.string().optional(),
  EMAIL_REMETENTE: z.string().email().default('contato@viztto.site'),
  EMAIL_NOME: z.string().min(1).default('Viztto'),
  MERCADO_PAGO_AMBIENTE: z.enum(['teste', 'producao']).default('teste'),
  MERCADO_PAGO_ACCESS_TOKEN: segredoOpcional(20),
  MERCADO_PAGO_PUBLIC_KEY: segredoOpcional(10),
  MERCADO_PAGO_WEBHOOK_SECRET: segredoOpcional(16),
})

const resultado = esquema.safeParse(process.env)
if (!resultado.success) {
  const mensagens = resultado.error.issues.map((erro) => `${erro.path.join('.')}: ${erro.message}`)
  throw new Error(`Variaveis de ambiente invalidas:\n${mensagens.join('\n')}`)
}

if (resultado.data.NODE_ENV === 'production' && !resultado.data.URL_APLICACAO)
  throw new Error('Variáveis de ambiente inválidas:\nURL_APLICACAO: obrigatória em produção')
if (resultado.data.NODE_ENV === 'production' && !resultado.data.BANCO_SENHA)
  throw new Error('Variáveis de ambiente inválidas:\nBANCO_SENHA: obrigatória em produção')
if (resultado.data.NODE_ENV === 'production' && !resultado.data.COOKIE_SEGURO)
  throw new Error('Variáveis de ambiente inválidas:\nCOOKIE_SEGURO: deve ser true em produção')
if (resultado.data.NODE_ENV === 'production' && !resultado.data.CONFIAR_PROXY)
  throw new Error('Variáveis de ambiente inválidas:\nCONFIAR_PROXY: deve ser true em produção')
if (
  resultado.data.NODE_ENV === 'production' &&
  !(resultado.data.EMAIL_HOST && resultado.data.EMAIL_USUARIO && resultado.data.EMAIL_SENHA)
) {
  throw new Error(
    'Variáveis de ambiente inválidas:\nEMAIL_HOST, EMAIL_USUARIO e EMAIL_SENHA: obrigatórias em produção',
  )
}

export const ambiente = {
  ...resultado.data,
  PORTA_SERVIDOR: resultado.data.PORT ?? resultado.data.PORTA ?? 3000,
  HOST_SERVIDOR: '0.0.0.0' as const,
  URL_APLICACAO: resultado.data.URL_APLICACAO ?? 'http://localhost:3000',
}
export const emProducao = ambiente.NODE_ENV === 'production'
