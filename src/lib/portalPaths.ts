/** UUID usado como id de projeto no portal. */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function caminhoPortalProjeto(workspaceSlug: string, projectId: string) {
  return `/${workspaceSlug}/${projectId}`
}

export function caminhoPortalMaterial(
  workspaceSlug: string,
  projectId: string,
  materialId: string,
) {
  return `/${workspaceSlug}/${projectId}/materiais/${materialId}`
}
