export type Workspace = {
  id: string
  name: string
  slug: string
  plan: 'freelancer' | 'studio' | 'agency'
  createdAt: string
}

export type User = {
  id: string
  workspaceId: string
  name: string
  email: string
  role: string
  avatar?: string
}

export type Client = {
  id: string
  workspaceId: string
  name: string
  company?: string
  email?: string
  phone?: string
  notes?: string
  color?: string
  status: 'active' | 'archived'
  projectCount: number
  pendingApprovals: number
  createdAt: string
  updatedAt: string
}

export type ProjectStatus =
  'draft' | 'in-review' | 'changes-requested' | 'waiting-approval' | 'approved' | 'archived'

export type Project = {
  id: string
  clientId: string
  name: string
  description?: string
  type: string
  status: ProjectStatus
  dueDate?: string
  progress: number
  materialCount: number
  commentCount: number
  members: string[]
  updatedAt: string
}

export type Material = {
  id: string
  projectId: string
  name: string
  type: 'image' | 'video' | 'pdf' | 'presentation' | 'web'
  status: 'draft' | 'waiting' | 'changes' | 'approved'
  currentVersion: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export type MaterialVersion = {
  id: string
  materialId: string
  number: number
  label: string
  createdBy: string
  createdAt: string
  approved: boolean
}

export type Comment = {
  id: string
  materialId: string
  versionId: string
  authorId: string
  content: string
  status: 'open' | 'resolved'
  createdAt: string
}

export type Approval = {
  id: string
  materialId: string
  versionId: string
  approverId: string
  status: 'waiting' | 'approved' | 'changes-requested'
  createdAt: string
}

export type Activity = {
  id: string
  workspaceId: string
  actor: string
  action: string
  target: string
  tone: 'neutral' | 'approval' | 'revision' | 'brand'
  createdAt: string
}

export type TeamMember = {
  id: string
  workspaceId: string
  name: string
  email: string
  role: 'Administrador' | 'Gestor' | 'Criativo' | 'Atendimento' | 'Cliente' | 'Visualizador'
  projectCount: number
  status: 'active' | 'invited'
  lastAccess: string
}

export type Notification = {
  id: string
  title: string
  description: string
  read: boolean
  tone: 'neutral' | 'approval' | 'revision' | 'warning'
  createdAt: string
}

export type OnboardingState = {
  workspaceName: string
  slug: string
  profile: string
  role: string
  clientId?: string
  projectId?: string
}
