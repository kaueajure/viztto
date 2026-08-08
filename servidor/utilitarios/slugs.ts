/** Segmentos de URL reservados para o app — nao podem ser slug de workspace. */
export const SLUGS_RESERVADOS = new Set([
  'app',
  'assets',
  'api',
  'arquivos',
  'entrar',
  'criar-conta',
  'esqueci-senha',
  'redefinir-senha',
  'aceitar-convite',
  'verificar-email',
  'onboarding',
  'p',
  'produto',
  'recursos',
  'precos',
  'contato',
  'termos',
  'privacidade',
  'design-system',
])

export function slugReservado(slug: string) {
  return SLUGS_RESERVADOS.has(slug.trim().toLowerCase())
}
