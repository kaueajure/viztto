/** UUID usado como id de projeto no portal. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function caminhoPortalProjeto(
  workspaceSlug: string,
  projectId: string,
  tokenPortal?: string,
) {
  const base = `/${workspaceSlug}/${projectId}`
  return tokenPortal
    ? `${base}?t=${encodeURIComponent(tokenPortal)}&v=${encodeURIComponent(tokenPortal.slice(0, 12))}`
    : base
}

export function caminhoPortalMaterial(
  workspaceSlug: string,
  projectId: string,
  materialId: string,
  tokenPortal?: string,
) {
  const base = `/${workspaceSlug}/${projectId}/materiais/${materialId}`
  return tokenPortal
    ? `${base}?t=${encodeURIComponent(tokenPortal)}&v=${encodeURIComponent(tokenPortal.slice(0, 12))}`
    : base
}

export function comTokenPortal(caminho: string, tokenPortal: string | null | undefined) {
  if (!tokenPortal) return caminho
  const sep = caminho.includes('?') ? '&' : '?'
  return `${caminho}${sep}t=${encodeURIComponent(tokenPortal)}&v=${encodeURIComponent(tokenPortal.slice(0, 12))}`
}
