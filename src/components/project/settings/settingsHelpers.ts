export type PermissaoParticipante = {
  podeEnviarMateriais: boolean
  podeResponderComentarios: boolean
}

export type PortalPermissoes = {
  permitirComentarios: boolean
  permitirAprovacao: boolean
  permitirSolicitacaoAlteracoes: boolean
  permitirDownloads: boolean
  permitirVersoesAntigas: boolean
}

export type ExpiracaoPreset = 'nenhuma' | '7' | '30' | 'personalizada'

export function dataInput(valor?: string | null) {
  if (!valor) return ''
  return String(valor).slice(0, 10)
}

export function formatarDataHora(valor?: string | null) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR')
}

export function diasAPartirDeHoje(dias: number) {
  const data = new Date()
  data.setHours(12, 0, 0, 0)
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

export function inicialNome(nome: string) {
  return (nome.trim()[0] ?? '?').toUpperCase()
}
