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
  return acaoEnvioAprovacaoAtividade({
    numeroVersao: entrada.numeroVersao,
    prontoParaCliente: entrada.materialFinalizado,
    faltam: entrada.faltam,
  })
}

/** Ação sem o nome do ator — envio interno para o Cliente 2 (não é aprovação final). */
export function acaoEnvioAprovacaoAtividade(entrada: {
  numeroVersao: number | string
  prontoParaCliente: boolean
  faltam?: number
}) {
  const v = `V${entrada.numeroVersao}`
  if (entrada.prontoParaCliente) return `enviou ${v} para aprovação do cliente.`
  const faltam = entrada.faltam ?? 0
  return `confirmou o envio de ${v}. Aguardando ${faltam} confirmação${faltam === 1 ? '' : 'ões'} interna${faltam === 1 ? '' : 's'}.`
}

export function descricaoAprovacaoNotificacao(entrada: {
  autorNome: string
  numeroVersao: number | string
  materialFinalizado: boolean
  faltam?: number
}) {
  return descricaoEnvioAprovacaoNotificacao({
    autorNome: entrada.autorNome,
    numeroVersao: entrada.numeroVersao,
    prontoParaCliente: entrada.materialFinalizado,
    faltam: entrada.faltam,
  })
}

export function descricaoEnvioAprovacaoNotificacao(entrada: {
  autorNome: string
  numeroVersao: number | string
  prontoParaCliente: boolean
  faltam?: number
}) {
  const nome = entrada.autorNome.trim() || 'Alguém'
  const v = `V${entrada.numeroVersao}`
  if (entrada.prontoParaCliente) {
    return `${nome} enviou ${v} para aprovação do cliente.`
  }
  const faltam = entrada.faltam ?? 0
  return `${nome} confirmou o envio de ${v}. Ainda falta ${faltam} confirmação${faltam === 1 ? '' : 'ões'} interna${faltam === 1 ? '' : 's'}.`
}
