export const supportedFormats = [
  'Imagens',
  'Vídeos',
  'PDFs',
  'Campanhas',
] as const

export const duplicatedFiles = [
  'campanha_final.png',
  'campanha_final_v2.png',
  'campanha_final_agora.png',
  'campanha_final_agora_v7.png',
  'campanha_final_aprovada.png',
  'campanha_final_aprovada_corrigida.png',
] as const

export const looseComments = [
  'Aumentar esse título.',
  'Não gostei daquela cor.',
  'Usar a imagem anterior.',
  'Acho que já aprovei essa versão.',
  'Trocar o texto do rodapé.',
] as const

export const organizedVersions = [
  'v1 · Primeiro envio',
  'v2 · Ajuste de composição',
  'v3 · Nova fotografia',
  'v4 · Versão atual',
] as const

export const outcomes = [
  {
    title: 'Comentários contextualizados',
    description: 'O feedback aparece exatamente sobre o ponto correspondente na imagem.',
  },
  {
    title: 'Versões organizadas',
    description: 'Cada novo envio mantém o histórico e evita arquivos duplicados.',
  },
  {
    title: 'Aprovações registradas',
    description: 'Saiba quem aprovou, quando aprovou e qual versão foi escolhida.',
  },
  {
    title: 'Menos retrabalho',
    description: 'Sua equipe deixa de interpretar mensagens e passa a executar alterações claras.',
  },
] as const
