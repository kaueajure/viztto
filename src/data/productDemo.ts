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

export const demoPins = [
  { number: 1, state: 'normal', position: 'left-[18%] top-[22%]' },
  { number: 2, state: 'pending', position: 'right-[18%] top-[29%]' },
  { number: 3, state: 'resolved', position: 'bottom-[18%] left-[29%]' },
] as const
