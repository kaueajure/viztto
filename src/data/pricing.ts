export type PricingPlan = {
  id: string
  name: string
  price: string
  audience: string
  features: string[]
  cta: string
  recommended?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'freelancer',
    name: 'Freelancer',
    price: 'R$ 39/mês',
    audience: 'Profissionais independentes e pequenos projetos.',
    features: [
      '5 projetos ativos',
      '10 GB de armazenamento',
      'Comentários em imagens e PDFs',
      'Comentários em vídeo',
      'Links para clientes',
      'Histórico de versões',
    ],
    cta: 'Começar gratuitamente',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 'R$ 99/mês',
    audience: 'Pequenas equipes e estúdios criativos.',
    features: [
      '25 projetos ativos',
      '100 GB de armazenamento',
      'Até 5 pessoas na equipe',
      'Vários aprovadores',
      'Identidade personalizada',
      'Calendário editorial',
      'Relatórios básicos',
    ],
    cta: 'Testar o Studio',
    recommended: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 'R$ 199/mês',
    audience: 'Agências que gerenciam vários clientes.',
    features: [
      'Projetos ativos ampliados',
      '500 GB de armazenamento',
      'Até 15 pessoas na equipe',
      'Espaços separados por cliente',
      'Portal personalizado',
      'Permissões',
      'Prioridade no suporte',
      'Histórico avançado',
    ],
    cta: 'Escolher Agency',
  },
]

export const pricingDisclaimer =
  'Preços e limites provisórios, sujeitos a validação antes do lançamento.'
