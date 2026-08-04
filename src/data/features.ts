export const mainFeatures = [
  {
    id: 'documents',
    navLabel: 'Comentários no material',
    meta: 'Imagens · PDFs · apresentações',
    title: 'Comentários diretamente sobre o material.',
    description:
      'Marque a área exata de uma imagem, página ou apresentação e mantenha cada conversa relacionada ao ponto correspondente.',
  },
  {
    id: 'video',
    navLabel: 'Feedback em vídeo',
    meta: 'Timestamp · cenas · versões de vídeo',
    title: 'Feedback no segundo exato do vídeo.',
    description:
      'Relacione cada comentário ao momento correto e evite orientações como “altera aquela parte do meio”.',
  },
  {
    id: 'versions',
    navLabel: 'Controle de versões',
    meta: 'Histórico preservado',
    title: 'Cada nova versão preserva o histórico.',
    description:
      'Compare alterações sem apagar comentários anteriores e saiba qual arquivo está realmente aguardando aprovação.',
  },
  {
    id: 'approval',
    navLabel: 'Aprovação registrada',
    meta: 'Pessoa · versão · data',
    title: 'Uma decisão clara, com pessoa e data.',
    description: 'Registre quem aprovou, quando aprovou e qual versão foi escolhida.',
  },
] as const

export type MainFeatureId = (typeof mainFeatures)[number]['id']
