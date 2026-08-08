import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { ambiente } from '../configuracao/ambiente.js'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Senha legivel de 8 caracteres (legado; portal atual usa token no link). */
export function gerarSenhaAcessoProjeto() {
  const bytes = randomBytes(8)
  return Array.from(bytes, (byte) => ALFABETO[byte % ALFABETO.length]).join('')
}

export async function gerarHashSenhaAcesso(senha: string) {
  return bcrypt.hash(senha, 12)
}

export async function senhaAcessoConfere(senha: string, hash: string) {
  return bcrypt.compare(senha, hash)
}

/** Token opaco do link de compartilhamento do portal (~32 chars URL-safe). */
export function gerarTokenPortal() {
  return randomBytes(24).toString('base64url')
}

export function tokenPortalConfere(recebido: string | undefined, esperado: string | null | undefined) {
  if (!recebido || !esperado) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export const COOKIE_PORTAL = 'viztto_portal'
const MAX_AGE_MS = 30 * 24 * 60 * 60_000

export function opcoesCookiePortal() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: ambiente.COOKIE_SEGURO,
    path: '/',
    maxAge: MAX_AGE_MS,
  }
}

export function assinarAcessoPortal(projetoId: string) {
  const expiraEm = Date.now() + MAX_AGE_MS
  const payload = `${projetoId}.${expiraEm}`
  const assinatura = createHmac('sha256', ambiente.SEGREDO_SESSAO)
    .update(payload)
    .digest('base64url')
  return `${payload}.${assinatura}`
}

export function validarAcessoPortal(token: string | undefined, projetoId: string) {
  if (!token) return false
  const partes = token.split('.')
  if (partes.length !== 3) return false
  const [id, expiraTexto, assinatura] = partes
  if (!id || !expiraTexto || !assinatura || id !== projetoId) return false
  const expiraEm = Number(expiraTexto)
  if (!Number.isFinite(expiraEm) || expiraEm < Date.now()) return false
  const payload = `${id}.${expiraTexto}`
  const esperada = createHmac('sha256', ambiente.SEGREDO_SESSAO)
    .update(payload)
    .digest('base64url')
  try {
    return timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))
  } catch {
    return false
  }
}

export function linkPortalProjeto(
  projetoId: string,
  workspaceSlug: string,
  tokenPortal: string,
) {
  const base = ambiente.URL_APLICACAO.replace(/\/$/, '')
  return `${base}/${workspaceSlug}/${projetoId}?t=${encodeURIComponent(tokenPortal)}`
}
