import type { Material, Project } from '@/types/domain'

export type ReviewWaitingContext =
  | 'aguardando_cliente'
  | 'aguardando_aprovador_interno'
  | 'aguardando_responsavel'
  | 'precisa_de_mim'
  | 'sem_acao_pendente'

export type ReviewWaitingEntrada = {
  material: Material
  project?: Project
  userId?: string | null
  /** IDs de aprovadores internos que já registraram o envio na versão atual. */
  approvedApproverIds?: string[]
}

export function getPendingApproverIds(
  project?: Project,
  approvedApproverIds: string[] = [],
): string[] {
  const aprovados = new Set(approvedApproverIds)
  return (project?.approverIds ?? []).filter((id) => !aprovados.has(id))
}

/**
 * Deriva quem deve agir a seguir, sem inventar status no banco.
 * Fonte única para Revisões, Projetos e Clientes.
 *
 * - `in-review` / aguardando_revisao → Cliente 2
 * - `changes-requested` → equipe (Cliente 1)
 * - `waiting-approval` → checklist interno incompleto; senão Cliente 2
 */
export function getReviewWaitingContext({
  material,
  project,
  userId,
  approvedApproverIds = material.approvedApproverIds ?? [],
}: ReviewWaitingEntrada): ReviewWaitingContext {
  const temAprovadoresInternos = Boolean(project?.approverIds?.length)
  const pendentes = getPendingApproverIds(project, approvedApproverIds)
  const souResponsavel = Boolean(userId && project?.memberIds.includes(userId))

  if (material.status === 'approved' || material.status === 'draft') {
    return 'sem_acao_pendente'
  }

  if (material.status === 'changes-requested') {
    if (souResponsavel || !userId) return 'precisa_de_mim'
    return 'aguardando_responsavel'
  }

  if (material.status === 'in-review') {
    return 'aguardando_cliente'
  }

  if (material.status === 'waiting-approval') {
    if (temAprovadoresInternos && pendentes.length > 0) {
      if (userId && pendentes.includes(userId)) return 'precisa_de_mim'
      return 'aguardando_aprovador_interno'
    }
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
export function labelAguardandoAcao(
  entrada: ReviewWaitingEntrada,
  nomesPendentes: string[] = [],
): string | null {
  const { material } = entrada
  if (material.status === 'changes-requested') return 'Cliente solicitou alterações'
  if (material.status === 'in-review') return 'Aguardando revisão do cliente'

  if (material.status !== 'waiting-approval') return null

  const ctx = getReviewWaitingContext(entrada)
  if (ctx === 'aguardando_cliente') return 'Aguardando cliente'

  if (nomesPendentes.length === 1) return `Aguardando confirmação de ${nomesPendentes[0]}`
  if (nomesPendentes.length > 1) return `Aguardando ${nomesPendentes.length} confirmações internas`

  const pendentes = getPendingApproverIds(
    entrada.project,
    entrada.approvedApproverIds ?? material.approvedApproverIds ?? [],
  )
  if (pendentes.length === 1 && entrada.project) {
    const idx = entrada.project.approverIds.indexOf(pendentes[0])
    const nome = idx >= 0 ? entrada.project.approvers[idx] : null
    if (nome) return `Aguardando confirmação de ${nome}`
  }
  if (pendentes.length > 1) return `Aguardando ${pendentes.length} confirmações internas`

  return 'Aguardando cliente'
}

export function countAguardandoCliente(
  materials: Material[],
  projectById: (projectId: string) => Project | undefined,
): number {
  return materials.filter((material) =>
    isAguardandoCliente({
      material,
      project: projectById(material.projectId),
      approvedApproverIds: material.approvedApproverIds,
    }),
  ).length
}
