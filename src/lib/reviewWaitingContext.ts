import type { Material, Project } from '@/types/domain'

export type ReviewWaitingContext =
  | 'aguardando_cliente'
  | 'aguardando_responsavel'
  | 'precisa_de_mim'
  | 'sem_acao_pendente'

export type ReviewWaitingEntrada = {
  material: Material
  project?: Project
  userId?: string | null
}

/**
 * Deriva quem deve agir a seguir.
 *
 * - `in-review` / `waiting-approval` (legado) → Cliente 2
 * - `changes-requested` → equipe (Cliente 1)
 * - `draft` / `approved` → sem ação pendente de revisão
 */
export function getReviewWaitingContext({
  material,
  project,
  userId,
}: ReviewWaitingEntrada): ReviewWaitingContext {
  const souResponsavel = Boolean(userId && project?.memberIds.includes(userId))

  if (material.status === 'approved' || material.status === 'draft') {
    return 'sem_acao_pendente'
  }

  if (material.status === 'changes-requested') {
    if (souResponsavel || !userId) return 'precisa_de_mim'
    return 'aguardando_responsavel'
  }

  if (material.status === 'in-review' || material.status === 'waiting-approval') {
    return 'aguardando_cliente'
  }

  return 'sem_acao_pendente'
}

export function isAguardandoCliente(entrada: ReviewWaitingEntrada) {
  return getReviewWaitingContext(entrada) === 'aguardando_cliente'
}

export function isPrecisaDeMim(entrada: ReviewWaitingEntrada) {
  return getReviewWaitingContext(entrada) === 'precisa_de_mim'
}

/** Rótulo curto para cards da Inbox de Revisões. */
export function labelAguardandoAcao(entrada: ReviewWaitingEntrada): string | null {
  const { material } = entrada
  if (material.status === 'changes-requested') return 'Cliente solicitou alterações'
  if (material.status === 'in-review' || material.status === 'waiting-approval')
    return 'Aguardando revisão do cliente'
  return null
}

export function countAguardandoCliente(
  materials: Material[],
  projectById: (projectId: string) => Project | undefined,
): number {
  return materials.filter((material) =>
    isAguardandoCliente({
      material,
      project: projectById(material.projectId),
    }),
  ).length
}
