import type { Activity } from '@/types/domain'

export const demoActivities: Activity[] = [
  {
    id: 'activity-1',
    workspaceId: 'workspace-aurora',
    actor: 'Marina',
    action: 'publicou a versão 4',
    target: 'Campanha de agosto',
    tone: 'brand',
    createdAt: 'Há 18 min',
  },
  {
    id: 'activity-2',
    workspaceId: 'workspace-aurora',
    actor: 'Bianca',
    action: 'solicitou alterações',
    target: 'Apresentação institucional',
    tone: 'revision',
    createdAt: 'Há 42 min',
  },
  {
    id: 'activity-3',
    workspaceId: 'workspace-aurora',
    actor: 'Rafael',
    action: 'aprovou o material',
    target: 'Vídeo institucional',
    tone: 'approval',
    createdAt: 'Há 2 h',
  },
  {
    id: 'activity-4',
    workspaceId: 'workspace-aurora',
    actor: 'Cliente',
    action: 'adicionou um comentário',
    target: 'Landing page institucional',
    tone: 'neutral',
    createdAt: 'Ontem',
  },
]
