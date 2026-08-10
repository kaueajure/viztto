import type { Material, Project } from '@/types/domain'

export type ReviewWaitingContext =
  | 'aguardando_cliente'
  | 'aguardando_aprovador_interno'
  | 'aguardando_responsavel'
  | 'precisa_de_mim'
  | 'sem_acao_pendente'

type Entrada = {
  material: Material
  project?: Project
  userId?: string | null
}

/**
 * Deriva quem deve agir a seguir, sem inventar status no banco.
 * - waiting-approval com aprovadores internos → aprovador interno
 * - waiting-approval sem aprovadores internos → cliente (portal)
 */
export function getReviewWaitingContext({
  material,
  project,
  userId,
}: Entrada): ReviewWaitingContext {
  const temAprovadoresInternos = Boolean(project?.approverIds?.length)
  const souAprovador = Boolean(userId && project?.approverIds.includes(userId))
  const souResponsavel = Boolean(userId && project?.memberIds.includes(userId))

  if (material.status === 'approved' || material.status === 'draft') {
    return 'sem_acao_pendente'
  }

  if (material.status === 'changes-requested') {
    if (souResponsavel || !userId) return 'precisa_de_mim'
    return 'aguardando_responsavel'
  }

  if (material.status === 'in-review') {
    if (souResponsavel || !userId) return 'precisa_de_mim'
    return 'aguardando_responsavel'
  }

  if (material.status === 'waiting-approval') {
    if (temAprovadoresInternos) {
      if (souAprovador) return 'precisa_de_mim'
      return 'aguardando_aprovador_interno'
    }
    return 'aguardando_cliente'
  }

  return 'sem_acao_pendente'
}

export function isAguardandoCliente(entrada: Entrada) {
  return getReviewWaitingContext(entrada) === 'aguardando_cliente'
}

export function isPrecisaDeMim(entrada: Entrada) {
  return getReviewWaitingContext(entrada) === 'precisa_de_mim'
}
