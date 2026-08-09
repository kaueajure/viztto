export type Workspace = {
  id: string
  name: string
  slug: string
  plan: 'gratuito' | 'freelancer' | 'studio' | 'agency'
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
  memberIds: string[]
  approvers: string[]
  approverIds: string[]
  updatedAt: string
}

export type MaterialStatus =
  'draft' | 'in-review' | 'changes-requested' | 'waiting-approval' | 'approved'

export type Material = {
  id: string
  projectId: string
  name: string
  type: 'image' | 'video' | 'pdf' | 'presentation' | 'web'
  status: MaterialStatus
  currentVersionId: string
  currentVersion: number
  commentCount: number
  unresolvedCommentCount: number
  createdAt: string
  updatedAt: string
}

export type MaterialVersion = {
  id: string
  materialId: string
  number: number
  label: string
  description?: string
  imageUrl?: string
  createdBy: string
  createdAt: string
  approved: boolean
  approvalId?: string
}

export type CommentReply = {
  id: string
  commentId: string
  authorId: string
  authorName: string
  text: string
  createdAt: string
}

export type ReviewComment = {
  id: string
  materialId: string
  versionId: string
  authorId: string
  authorName: string
  text: string
  x: number
  y: number
  timestampSeconds?: number
  pdfPage?: number
  status: 'open' | 'resolved'
  createdAt: string
  updatedAt: string
  replies: CommentReply[]
  originCommentId?: string
}

export type Approval = {
  id: string
  materialId: string
  versionId: string
  approvedBy: string
  approvedAt: string
  note?: string
}

export type Activity = {
  id: string
  workspaceId: string
  actor: string
  action: string
  target: string
  tone: 'neutral' | 'approval' | 'revision' | 'brand'
  createdAt: string
  tipo?: string
  projectId?: string
  materialId?: string
  versionId?: string
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
  clientDraft?: { name: string; email?: string; company?: string; notes?: string }
  projectDraft?: { name: string; type: string; dueDate?: string; description?: string }
}
