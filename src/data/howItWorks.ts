export type HowItWorksStepId = 'upload' | 'share' | 'review' | 'approve'

export type HowItWorksStep = {
  id: HowItWorksStepId
  number: string
  label: string
  title: string
  description: string
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 'upload',
    number: '01',
    label: 'Envie',
    title: 'Envie o material',
    description:
      'Organize imagens, vídeos e PDFs por cliente, projeto ou campanha.',
  },
  {
    id: 'share',
    number: '02',
    label: 'Compartilhe',
    title: 'Compartilhe um link',
    description:
      'Envie um acesso seguro para o cliente revisar sem instalar nada e sem criar uma conta obrigatoriamente.',
  },
  {
    id: 'review',
    number: '03',
    label: 'Revise',
    title: 'Comente no lugar certo',
    description:
      'Crie comentários diretamente sobre o ponto correspondente na imagem e mantenha o contexto na revisão.',
  },
  {
    id: 'approve',
    number: '04',
    label: 'Aprove',
    title: 'Registre a decisão final',
    description: 'Saiba quem aprovou, quando aprovou e qual versão foi escolhida.',
  },
]
