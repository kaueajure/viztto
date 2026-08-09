export const mainFeatures = [
  {
    id: 'documents',
    navLabel: 'Feedback visual',
    meta: 'Imagens · Vídeos · PDFs',
    title: 'Comentários no lugar certo.',
    description:
      'Marque o ponto na imagem, o instante do vídeo ou a página do PDF — cada conversa fica no contexto do material.',
  },
  {
    id: 'video',
    navLabel: 'Vídeo e PDF',
    meta: 'Timestamp · páginas',
    title: 'Revise vídeo e PDF no mesmo fluxo.',
    description:
      'Comente no momento do vídeo ou na página do PDF; o cliente abre o link e vê a mesma referência.',
  },
  {
    id: 'versions',
    navLabel: 'Versões',
    meta: 'Histórico preservado',
    title: 'Cada nova versão preserva o histórico.',
    description:
      'Compare alterações sem apagar comentários anteriores e saiba qual arquivo está realmente aguardando aprovação.',
  },
  {
    id: 'approval',
    navLabel: 'Aprovação',
    meta: 'Pessoa · versão · data',
    title: 'Uma decisão clara, com pessoa e data.',
    description: 'Registre quem aprovou, quando aprovou e qual versão foi escolhida.',
  },
] as const

export type MainFeatureId = (typeof mainFeatures)[number]['id']
