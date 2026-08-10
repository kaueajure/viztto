/**
 * Formata segundos de vídeo para exibição (ex.: 18 → 0:18, 125 → 2:05).
 * Espelha a lógica do frontend em src/lib/formatVideoTimestamp.ts.
 */
export function formatarTimestampVideo(seconds?: number | string | null) {
  if (seconds == null || seconds === '') return ''
  const n = typeof seconds === 'string' ? Number(seconds) : seconds
  if (Number.isNaN(n)) return ''
  const total = Math.max(0, Math.floor(n))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Ação sem o nome do ator — a UI monta `actor + action`. */
export function acaoComentarioAtividade(entrada: {
  tipoMaterial: 'imagem' | 'video' | 'pdf' | string
  timestampSegundos?: number | string | null
  paginaPdf?: number | null
}) {
  if (entrada.tipoMaterial === 'video' && entrada.timestampSegundos != null) {
    const ts = formatarTimestampVideo(entrada.timestampSegundos)
    if (ts) return `comentou no vídeo em ${ts}.`
  }
  if (entrada.tipoMaterial === 'pdf' && entrada.paginaPdf != null) {
    return `comentou na página ${entrada.paginaPdf} do PDF.`
  }
  if (entrada.tipoMaterial === 'imagem') return 'comentou na imagem.'
  if (entrada.tipoMaterial === 'video') return 'comentou no vídeo.'
  if (entrada.tipoMaterial === 'pdf') return 'comentou no PDF.'
  return 'comentou no material.'
}

/** Frase completa para notificação/e-mail (inclui o nome). */
export function descricaoComentarioNotificacao(entrada: {
  autorNome: string
  tipoMaterial: 'imagem' | 'video' | 'pdf' | string
  timestampSegundos?: number | string | null
  paginaPdf?: number | null
}) {
  const nome = entrada.autorNome.trim() || 'Alguém'
  return `${nome} ${acaoComentarioAtividade(entrada)}`
}

/** @deprecated Preferir acaoComentarioAtividade + descricaoComentarioNotificacao */
export function descricaoComentarioAtividade(entrada: {
  autorNome: string
  tipoMaterial: 'imagem' | 'video' | 'pdf' | string
  timestampSegundos?: number | string | null
  paginaPdf?: number | null
}) {
  return descricaoComentarioNotificacao(entrada)
}

export function acaoAprovacaoAtividade(entrada: {
  numeroVersao: number | string
  materialFinalizado: boolean
  faltam?: number
}) {
  const v = `V${entrada.numeroVersao}`
  if (entrada.materialFinalizado) return `aprovou ${v}.`
  const faltam = entrada.faltam ?? 0
  return `aprovou ${v}. Aguardando ${faltam} aprovação${faltam === 1 ? '' : 'ões'}.`
}

export function descricaoAprovacaoNotificacao(entrada: {
  autorNome: string
  numeroVersao: number | string
  materialFinalizado: boolean
  faltam?: number
}) {
  const nome = entrada.autorNome.trim() || 'Alguém'
  const v = `V${entrada.numeroVersao}`
  if (entrada.materialFinalizado) {
    return `${nome} aprovou ${v}. Todas as aprovações foram concluídas.`
  }
  const faltam = entrada.faltam ?? 0
  return `${nome} aprovou ${v}. Ainda falta ${faltam} aprovação${faltam === 1 ? '' : 'ões'}.`
}
