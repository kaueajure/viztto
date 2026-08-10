/**
 * Formata segundos de vídeo para exibição em atividades (ex.: 18 → 0:18, 125 → 2:05).
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

export function descricaoComentarioAtividade(entrada: {
  autorNome: string
  tipoMaterial: 'imagem' | 'video' | 'pdf' | string
  timestampSegundos?: number | string | null
  paginaPdf?: number | null
}) {
  const nome = entrada.autorNome.trim() || 'Alguém'
  if (entrada.tipoMaterial === 'video' && entrada.timestampSegundos != null) {
    const ts = formatarTimestampVideo(entrada.timestampSegundos)
    if (ts) return `${nome} comentou no vídeo em ${ts}.`
  }
  if (entrada.tipoMaterial === 'pdf' && entrada.paginaPdf != null) {
    return `${nome} comentou na página ${entrada.paginaPdf} do PDF.`
  }
  if (entrada.tipoMaterial === 'imagem') return `${nome} comentou na imagem.`
  if (entrada.tipoMaterial === 'video') return `${nome} comentou no vídeo.`
  if (entrada.tipoMaterial === 'pdf') return `${nome} comentou no PDF.`
  return `${nome} comentou no material.`
}
