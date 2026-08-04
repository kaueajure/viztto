export const productDemo = {
  project: 'Campanha de lançamento',
  material: 'Post principal',
  participants: ['Marina Costa', 'Rafael Lima', 'Bianca Alves'],
  commentCount: 4,
  selectedComment: {
    author: 'Marina Costa',
    time: 'agora',
    text: 'Podemos aumentar o contraste deste título? Ele perde força sobre o fundo atual.',
  },
} as const

export type DemoPhase = 'waiting' | 'commenting' | 'new-version' | 'approved' | 'resetting'

export const demoPhaseContent: Record<
  Exclude<DemoPhase, 'resetting'>,
  { label: string; duration: number }
> = {
  waiting: { label: 'Aguardando revisão', duration: 1600 },
  commenting: { label: 'Comentário criado', duration: 2600 },
  'new-version': { label: 'Nova versão enviada', duration: 2100 },
  approved: { label: 'Versão aprovada', duration: 2800 },
}

export const demoPhaseOrder = ['waiting', 'commenting', 'new-version', 'approved'] as const
export const demoResetDuration = 550

export const demoPins = [
  { number: 1, state: 'normal', position: 'left-[18%] top-[22%]' },
  { number: 2, state: 'pending', position: 'right-[18%] top-[29%]' },
  { number: 3, state: 'resolved', position: 'bottom-[18%] left-[29%]' },
] as const
