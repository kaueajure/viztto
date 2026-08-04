import type { Notification } from '@/types/domain'

export const demoNotifications: Notification[] = [
  {
    id: 'notification-1',
    title: 'Novo comentário',
    description: 'Bianca comentou em Campanha de agosto.',
    read: false,
    tone: 'neutral',
    createdAt: 'Há 12 min',
  },
  {
    id: 'notification-2',
    title: 'Alteração solicitada',
    description: 'Apresentação institucional precisa de ajustes.',
    read: false,
    tone: 'revision',
    createdAt: 'Há 40 min',
  },
  {
    id: 'notification-3',
    title: 'Aprovação concluída',
    description: 'O vídeo institucional foi aprovado.',
    read: true,
    tone: 'approval',
    createdAt: 'Há 2 h',
  },
  {
    id: 'notification-4',
    title: 'Prazo próximo',
    description: 'Lançamento da coleção vence em três dias.',
    read: true,
    tone: 'warning',
    createdAt: 'Hoje',
  },
]
