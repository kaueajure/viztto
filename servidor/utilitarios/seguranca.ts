import { createHash, randomBytes, randomUUID } from 'node:crypto'

export const novoId = () => randomUUID()
export const novoToken = () => randomBytes(32).toString('base64url')
export const gerarHash = (valor: string) => createHash('sha256').update(valor).digest('hex')
export const normalizarEmail = (email: string) => email.trim().toLocaleLowerCase('pt-BR')
