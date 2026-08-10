/**
 * Catálogo canônico: tipos de projeto ≠ formatos de material.
 * Use estes valores em formulários, filtros, landing e documentação.
 */

export const PROJECT_TYPES = [
  { value: 'Campanha', label: 'Campanha' },
  { value: 'Redes sociais', label: 'Redes sociais' },
  { value: 'Vídeo', label: 'Vídeo' },
  { value: 'Site', label: 'Site' },
  { value: 'Apresentação', label: 'Apresentação' },
  { value: 'Outro', label: 'Outro' },
] as const

export type ProjectTypeValue = (typeof PROJECT_TYPES)[number]['value']

export const MATERIAL_FORMATS = [
  { value: 'image', api: 'imagem', label: 'Imagem' },
  { value: 'video', api: 'video', label: 'Vídeo' },
  { value: 'pdf', api: 'pdf', label: 'PDF' },
] as const

export type MaterialFormatValue = (typeof MATERIAL_FORMATS)[number]['value']

/** Status de projeto exibidos na UI (mapeiam para o enum do banco). */
export const PROJECT_STATUS_OPTIONS = [
  { value: 'draft', api: 'rascunho', label: 'Rascunho' },
  { value: 'in-progress', api: 'em_andamento', label: 'Em andamento' },
  { value: 'in-review', api: 'aguardando_revisao', label: 'Aguardando revisão' },
  { value: 'waiting-approval', api: 'aguardando_aprovacao', label: 'Aguardando cliente' },
  { value: 'changes-requested', api: 'alteracoes_solicitadas', label: 'Alterações solicitadas' },
  { value: 'approved', api: 'aprovado', label: 'Concluído' },
  { value: 'archived', api: 'arquivado', label: 'Arquivado' },
] as const

export function projectTypeLabel(tipo: string | null | undefined) {
  const found = PROJECT_TYPES.find((item) => item.value === tipo)
  return found?.label ?? (tipo?.trim() || 'Outro')
}

export function projectStatusLabel(status: string | null | undefined) {
  const found = PROJECT_STATUS_OPTIONS.find(
    (item) => item.value === status || item.api === status,
  )
  return found?.label ?? status ?? '—'
}

export function toApiProjectStatus(status: string): string {
  const found = PROJECT_STATUS_OPTIONS.find((item) => item.value === status)
  return found?.api ?? status
}

export function fromApiProjectStatus(status: string): string {
  const found = PROJECT_STATUS_OPTIONS.find((item) => item.api === status)
  return found?.value ?? 'draft'
}
