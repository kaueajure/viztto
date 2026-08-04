import type { Activity } from '@/types/domain'

export const demoActivities: Activity[] = [
  {
    id: 'activity-1',
    workspaceId: 'workspace-aurora',
    actor: 'Marina',
    action: 'publicou a versão 4',
    target: 'Campanha de agosto',
    tone: 'brand',
    createdAt: '2026-08-03T14:12:00.000Z',
  },
  {
    id: 'activity-2',
    workspaceId: 'workspace-aurora',
    actor: 'Bianca',
    action: 'solicitou alterações',
    target: 'Apresentação institucional',
    tone: 'revision',
    createdAt: '2026-08-03T13:48:00.000Z',
  },
  {
    id: 'activity-3',
    workspaceId: 'workspace-aurora',
    actor: 'Rafael',
    action: 'aprovou o material',
    target: 'Vídeo institucional',
    tone: 'approval',
    createdAt: '2026-08-03T12:30:00.000Z',
  },
  {
    id: 'activity-4',
    workspaceId: 'workspace-aurora',
    actor: 'Cliente',
    action: 'adicionou um comentário',
    target: 'Landing page institucional',
    tone: 'neutral',
    createdAt: '2026-08-02T16:00:00.000Z',
  },
]
