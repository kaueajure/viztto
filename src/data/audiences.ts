export type AudienceId = 'agencies' | 'social' | 'design' | 'video' | 'web' | 'marketing'

export type Audience = {
  id: AudienceId
  label: string
  title: string
  description: string
  highlights: string[]
}

export const audiences: Audience[] = [
  {
    id: 'agencies',
    label: 'Agências',
    title: 'Vários clientes sem misturar versões.',
    description:
      'Organize projetos, campanhas, aprovadores e pendências em espaços separados para cada cliente.',
    highlights: [
      'Múltiplos clientes',
      'Diferentes aprovadores',
      'Portal personalizado',
      'Histórico centralizado',
    ],
  },
  {
    id: 'social',
    label: 'Social media',
    title: 'Calendário, peças e aprovações no mesmo fluxo.',
    description:
      'Organize posts, carrosséis, Reels e campanhas sem depender de grupos e arquivos espalhados.',
    highlights: [
      'Calendário editorial',
      'Aprovação por conteúdo',
      'Revisão mobile',
      'Status por publicação',
    ],
  },
  {
    id: 'design',
    label: 'Designers',
    title: 'Feedback visual sem interpretação.',
    description: 'Receba comentários diretamente sobre a área que precisa ser alterada.',
    highlights: ['Pins', 'Comparação de versões', 'Comentários resolvidos', 'Histórico visual'],
  },
  {
    id: 'video',
    label: 'Vídeo',
    title: 'Comentários vinculados ao momento exato.',
    description:
      'Evite mensagens como “muda aquela parte do meio” com feedback relacionado ao tempo correto do vídeo.',
    highlights: [
      'Comentários por timestamp',
      'Revisão de cenas',
      'Versões de vídeo',
      'Aprovação final',
    ],
  },
  {
    id: 'web',
    label: 'Desenvolvimento web',
    title: 'Feedback diretamente sobre páginas e componentes.',
    description:
      'Organize alterações de interface sem depender de capturas de tela e descrições vagas.',
    highlights: [
      'Páginas revisáveis',
      'Comentários por região',
      'Estados responsivos',
      'Controle de versões',
    ],
  },
  {
    id: 'marketing',
    label: 'Equipes de marketing',
    title: 'Decisões claras entre criação, liderança e negócio.',
    description:
      'Centralize materiais, responsáveis e aprovações internas em um histórico confiável.',
    highlights: ['Vários departamentos', 'Aprovadores', 'Prazos', 'Decisões registradas'],
  },
]
