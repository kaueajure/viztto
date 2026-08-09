import type { MaterialType } from '@/types/domain'

const SUPPORTED = new Set<MaterialType>(['image', 'video', 'pdf'])

/** Normaliza tipos da API/legado para os formatos oficialmente suportados. */
export function normalizeMaterialType(tipo: string | null | undefined): MaterialType {
  const value = String(tipo ?? '').toLowerCase()
  if (value === 'imagem' || value === 'image') return 'image'
  if (value === 'video') return 'video'
  if (value === 'pdf') return 'pdf'
  // Legado: apresentacao / pagina_web / presentation / web → pdf (documento)
  if (
    value === 'apresentacao' ||
    value === 'presentation' ||
    value === 'pagina_web' ||
    value === 'web'
  )
    return 'pdf'
  if (SUPPORTED.has(value as MaterialType)) return value as MaterialType
  return 'pdf'
}

export function materialTypeLabel(tipo: string | null | undefined): string {
  switch (normalizeMaterialType(tipo)) {
    case 'image':
      return 'Imagem'
    case 'video':
      return 'Vídeo'
    default:
      return 'PDF'
  }
}

export function toApiMaterialType(tipo: MaterialType): 'imagem' | 'video' | 'pdf' {
  if (tipo === 'image') return 'imagem'
  if (tipo === 'video') return 'video'
  return 'pdf'
}

export type { MaterialType }
