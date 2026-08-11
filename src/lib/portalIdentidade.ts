const chave = (projetoId: string) => `viztto:portal-contato:${projetoId}`

export type IdentidadePortal = {
  nome: string
  email: string
}

export function lerIdentidadePortal(projetoId: string): IdentidadePortal | null {
  try {
    const raw = sessionStorage.getItem(chave(projetoId))
    if (!raw) return null
    const parseado = JSON.parse(raw) as IdentidadePortal
    if (!parseado?.nome?.trim() || !parseado?.email?.trim()) return null
    return { nome: parseado.nome.trim(), email: parseado.email.trim() }
  } catch {
    return null
  }
}

export function salvarIdentidadePortal(projetoId: string, identidade: IdentidadePortal) {
  sessionStorage.setItem(
    chave(projetoId),
    JSON.stringify({
      nome: identidade.nome.trim(),
      email: identidade.email.trim().toLowerCase(),
    }),
  )
}
