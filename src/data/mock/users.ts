import type { TeamMember, User } from '@/types/domain'

export const demoUser: User = {
  id: 'user-marina',
  workspaceId: 'workspace-aurora',
  name: 'Marina Costa',
  email: 'marina@exemplo.viztto',
  role: 'Administrador',
}

export const demoTeam: TeamMember[] = [
  {
    id: 'user-marina',
    workspaceId: 'workspace-aurora',
    name: 'Marina Costa',
    email: 'marina@exemplo.viztto',
    role: 'Administrador',
    projectCount: 5,
    status: 'active',
    lastAccess: 'Agora',
  },
  {
    id: 'user-rafael',
    workspaceId: 'workspace-aurora',
    name: 'Rafael Lima',
    email: 'rafael@exemplo.viztto',
    role: 'Criativo',
    projectCount: 4,
    status: 'active',
    lastAccess: 'Hoje, 14:20',
  },
  {
    id: 'user-bianca',
    workspaceId: 'workspace-aurora',
    name: 'Bianca Alves',
    email: 'bianca@exemplo.viztto',
    role: 'Atendimento',
    projectCount: 3,
    status: 'active',
    lastAccess: 'Ontem, 18:05',
  },
]
