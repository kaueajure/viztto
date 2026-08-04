import { createContext, useContext, useState, type ReactNode } from 'react'
import { demoActivities } from '@/data/mock/activities'
import { demoClients } from '@/data/mock/clients'
import { demoApprovals, demoComments, demoMaterials, demoVersions } from '@/data/mock/materials'
import { demoNotifications } from '@/data/mock/notifications'
import { demoProjects } from '@/data/mock/projects'
import { demoTeam } from '@/data/mock/users'
import { demoWorkspace } from '@/data/mock/workspace'
import { localStorageService, storageKeys } from '@/services/localStorageService'
import type {
  Activity,
  Approval,
  Client,
  Material,
  MaterialStatus,
  MaterialVersion,
  Notification,
  OnboardingState,
  Project,
  ProjectStatus,
  ReviewComment,
  TeamMember,
  Workspace,
} from '@/types/domain'

type NewClient = Pick<Client, 'name'> &
  Partial<Pick<Client, 'company' | 'email' | 'phone' | 'notes' | 'color'>>
type NewProject = Pick<Project, 'name' | 'clientId'> &
  Partial<Pick<Project, 'description' | 'type' | 'dueDate' | 'members'>>
type NewMaterial = Pick<Material, 'name' | 'projectId' | 'type'>
type NewComment = Pick<ReviewComment, 'materialId' | 'versionId' | 'text' | 'x' | 'y'> &
  Partial<Pick<ReviewComment, 'authorId' | 'authorName' | 'originCommentId'>>
type NewVersion = Pick<MaterialVersion, 'materialId' | 'label'> &
  Partial<Pick<MaterialVersion, 'description' | 'imageUrl' | 'createdBy'>> & {
    copyPending?: boolean
  }
type NewActivity = Pick<Activity, 'action' | 'target' | 'tone'> &
  Partial<Pick<Activity, 'actor' | 'materialId' | 'versionId'>>

type AppDataValue = {
  workspace: Workspace
  clients: Client[]
  projects: Project[]
  team: TeamMember[]
  onboarding: OnboardingState
  materials: Material[]
  materialVersions: MaterialVersion[]
  comments: ReviewComment[]
  approvals: Approval[]
  activities: Activity[]
  notifications: Notification[]
  updateOnboarding: (patch: Partial<OnboardingState>) => void
  updateWorkspace: (patch: Partial<Workspace>) => void
  addClient: (client: NewClient) => Client
  addProject: (project: NewProject) => Project
  addTeamMember: (member: Pick<TeamMember, 'name' | 'email' | 'role'>) => void
  addMaterial: (material: NewMaterial) => Material
  updateMaterial: (materialId: string, patch: Partial<Material>) => void
  addMaterialVersion: (version: NewVersion) => MaterialVersion
  setCurrentVersion: (materialId: string, versionId: string) => void
  addComment: (comment: NewComment) => ReviewComment
  updateComment: (commentId: string, text: string) => void
  deleteComment: (commentId: string) => void
  resolveComment: (commentId: string) => void
  reopenComment: (commentId: string) => void
  addCommentReply: (commentId: string, text: string, authorName?: string) => void
  requestChanges: (materialId: string) => boolean
  approveVersion: (materialId: string, versionId: string, approvedBy?: string) => Approval
  reopenReview: (materialId: string) => void
  addActivity: (activity: NewActivity) => Activity
  restoreDemo: () => void
}

const AppDataContext = createContext<AppDataValue | null>(null)
const emptyOnboarding: OnboardingState = { workspaceName: '', slug: '', profile: '', role: '' }
const now = () => new Date().toISOString()
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const statusMap: Record<string, MaterialStatus> = {
  waiting: 'waiting-approval',
  changes: 'changes-requested',
}

function migrateMaterials(stored: Array<Partial<Material>>): Material[] {
  return stored.map((item, index) => {
    const currentVersion = Number(item.currentVersion ?? 1)
    const materialId = item.id ?? `material-migrated-${index}`
    return {
      id: materialId,
      projectId: item.projectId ?? '',
      name: item.name ?? 'Material sem nome',
      type: item.type ?? 'image',
      status: statusMap[String(item.status)] ?? item.status ?? 'draft',
      currentVersionId:
        item.currentVersionId ??
        demoMaterials.find((material) => material.id === materialId)?.currentVersionId ??
        `version-${materialId}-${currentVersion}`,
      currentVersion,
      commentCount: Number(item.commentCount ?? 0),
      unresolvedCommentCount: Number(item.unresolvedCommentCount ?? item.commentCount ?? 0),
      createdAt: item.createdAt ?? now(),
      updatedAt: item.updatedAt ?? now(),
    }
  })
}

function projectStatus(materials: Material[]): ProjectStatus {
  if (!materials.length) return 'draft'
  if (materials.some((item) => item.status === 'changes-requested')) return 'changes-requested'
  if (materials.some((item) => item.status === 'waiting-approval')) return 'waiting-approval'
  if (materials.some((item) => item.status === 'in-review')) return 'in-review'
  if (materials.every((item) => item.status === 'approved')) return 'approved'
  return 'draft'
}

function deriveProjects(projects: Project[], materials: Material[], comments: ReviewComment[]) {
  return projects.map((project) => {
    const related = materials.filter((item) => item.projectId === project.id)
    if (!related.length) return project
    const relatedIds = new Set(related.map((item) => item.id))
    const openCount = comments.filter(
      (comment) => relatedIds.has(comment.materialId) && comment.status === 'open',
    ).length
    return {
      ...project,
      status: projectStatus(related),
      progress: Math.round(
        (related.filter((item) => item.status === 'approved').length / related.length) * 100,
      ),
      materialCount: related.length,
      commentCount: openCount,
      updatedAt: related.reduce(
        (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
        project.updatedAt,
      ),
    }
  })
}

function deriveClients(clients: Client[], projects: Project[], materials: Material[]) {
  return clients.map((client) => {
    const projectIds = new Set(
      projects.filter((project) => project.clientId === client.id).map((project) => project.id),
    )
    return {
      ...client,
      projectCount: projectIds.size,
      pendingApprovals: materials.filter(
        (material) => projectIds.has(material.projectId) && material.status === 'waiting-approval',
      ).length,
    }
  })
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState(() =>
    localStorageService.get(storageKeys.workspace, demoWorkspace),
  )
  const [clients, setClients] = useState<Client[]>(() =>
    localStorageService.get(storageKeys.clients, demoClients),
  )
  const [projects, setProjects] = useState<Project[]>(() =>
    localStorageService.get(storageKeys.projects, demoProjects),
  )
  const [team, setTeam] = useState<TeamMember[]>(() =>
    localStorageService.get(storageKeys.team, demoTeam),
  )
  const [onboarding, setOnboarding] = useState<OnboardingState>(() =>
    localStorageService.get(storageKeys.onboarding, emptyOnboarding),
  )
  const [materials, setMaterials] = useState<Material[]>(() =>
    migrateMaterials(localStorageService.get(storageKeys.materials, demoMaterials)),
  )
  const [materialVersions, setMaterialVersions] = useState<MaterialVersion[]>(() => {
    const stored = localStorageService.get(storageKeys.materialVersions, demoVersions)
    const known = new Set(stored.map((version) => version.id))
    const missing = materials
      .filter((material) => !known.has(material.currentVersionId))
      .map<MaterialVersion>((material) => ({
        id: material.currentVersionId,
        materialId: material.id,
        number: material.currentVersion,
        label: 'Versão migrada',
        imageUrl: material.type === 'image' ? '/demo/review-campaign-v4.svg' : undefined,
        createdBy: 'Marina',
        createdAt: material.updatedAt,
        approved: material.status === 'approved',
      }))
    return [...stored, ...missing]
  })
  const [comments, setComments] = useState<ReviewComment[]>(() =>
    localStorageService.get(storageKeys.comments, demoComments),
  )
  const [approvals, setApprovals] = useState<Approval[]>(() =>
    localStorageService.get(storageKeys.approvals, demoApprovals),
  )
  const [activities, setActivities] = useState<Activity[]>(() =>
    localStorageService.get(storageKeys.activities, demoActivities),
  )
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    localStorageService.get(storageKeys.notifications, demoNotifications),
  )

  const persistReview = (nextMaterials: Material[], nextComments: ReviewComment[]) => {
    const nextProjects = deriveProjects(projects, nextMaterials, nextComments)
    const nextClients = deriveClients(clients, nextProjects, nextMaterials)
    setMaterials(nextMaterials)
    setComments(nextComments)
    setProjects(nextProjects)
    setClients(nextClients)
    localStorageService.set(storageKeys.materials, nextMaterials)
    localStorageService.set(storageKeys.comments, nextComments)
    localStorageService.set(storageKeys.projects, nextProjects)
    localStorageService.set(storageKeys.clients, nextClients)
  }

  const pushActivity = (input: NewActivity) => {
    const activity: Activity = {
      id: id('activity'),
      workspaceId: workspace.id,
      actor: input.actor ?? 'Marina',
      action: input.action,
      target: input.target,
      tone: input.tone,
      createdAt: now(),
      materialId: input.materialId,
      versionId: input.versionId,
    }
    const next = [activity, ...activities]
    setActivities(next)
    localStorageService.set(storageKeys.activities, next)
    return activity
  }

  const value: AppDataValue = {
    workspace,
    clients,
    projects,
    team,
    onboarding,
    materials,
    materialVersions,
    comments,
    approvals,
    activities,
    notifications,
    updateOnboarding(patch) {
      const next = { ...onboarding, ...patch }
      setOnboarding(next)
      localStorageService.set(storageKeys.onboarding, next)
    },
    updateWorkspace(patch) {
      const next = { ...workspace, ...patch }
      setWorkspace(next)
      localStorageService.set(storageKeys.workspace, next)
    },
    addClient(input) {
      const timestamp = now()
      const client: Client = {
        id: id('client'),
        workspaceId: workspace.id,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        color: input.color ?? '#b8ff4f',
        status: 'active',
        projectCount: 0,
        pendingApprovals: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const next = [client, ...clients]
      setClients(next)
      localStorageService.set(storageKeys.clients, next)
      return client
    },
    addProject(input) {
      const project: Project = {
        id: id('project'),
        clientId: input.clientId,
        name: input.name,
        description: input.description,
        type: input.type ?? 'Campanha',
        status: 'draft',
        dueDate: input.dueDate,
        progress: 0,
        materialCount: 0,
        commentCount: 0,
        members: input.members ?? ['Marina'],
        updatedAt: now(),
      }
      const nextProjects = [project, ...projects]
      const nextClients = deriveClients(clients, nextProjects, materials)
      setProjects(nextProjects)
      setClients(nextClients)
      localStorageService.set(storageKeys.projects, nextProjects)
      localStorageService.set(storageKeys.clients, nextClients)
      return project
    },
    addTeamMember(input) {
      const member: TeamMember = {
        id: id('member'),
        workspaceId: workspace.id,
        ...input,
        projectCount: 0,
        status: 'invited',
        lastAccess: 'Convite enviado',
      }
      const next = [...team, member]
      setTeam(next)
      localStorageService.set(storageKeys.team, next)
    },
    addMaterial(input) {
      const materialId = id('material')
      const versionId = id('version')
      const timestamp = now()
      const material: Material = {
        id: materialId,
        projectId: input.projectId,
        name: input.name,
        type: input.type,
        status: 'draft',
        currentVersionId: versionId,
        currentVersion: 1,
        commentCount: 0,
        unresolvedCommentCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const version: MaterialVersion = {
        id: versionId,
        materialId,
        number: 1,
        label: 'Primeira versão',
        imageUrl: input.type === 'image' ? '/demo/review-campaign-v2.svg' : undefined,
        createdBy: 'Marina',
        createdAt: timestamp,
        approved: false,
      }
      setMaterialVersions([...materialVersions, version])
      localStorageService.set(storageKeys.materialVersions, [...materialVersions, version])
      persistReview([material, ...materials], comments)
      return material
    },
    updateMaterial(materialId, patch) {
      persistReview(
        materials.map((item) =>
          item.id === materialId ? { ...item, ...patch, updatedAt: now() } : item,
        ),
        comments,
      )
    },
    addMaterialVersion(input) {
      const material = materials.find((item) => item.id === input.materialId)
      if (!material) throw new Error('Material não encontrado')
      const timestamp = now()
      const version: MaterialVersion = {
        id: id('version'),
        materialId: material.id,
        number:
          Math.max(
            0,
            ...materialVersions
              .filter((item) => item.materialId === material.id)
              .map((item) => item.number),
          ) + 1,
        label: input.label,
        description: input.description,
        imageUrl: input.imageUrl ?? '/demo/review-campaign-v4.svg',
        createdBy: input.createdBy ?? 'Marina',
        createdAt: timestamp,
        approved: false,
      }
      const copied = input.copyPending
        ? comments
            .filter(
              (comment) =>
                comment.materialId === material.id &&
                comment.versionId === material.currentVersionId &&
                comment.status === 'open',
            )
            .map<ReviewComment>((comment) => ({
              ...comment,
              id: id('comment'),
              versionId: version.id,
              originCommentId: comment.id,
              createdAt: timestamp,
              updatedAt: timestamp,
              replies: [],
            }))
        : []
      const nextVersions = [...materialVersions, version]
      const nextComments = [...comments, ...copied]
      const nextMaterials = materials.map((item) =>
        item.id === material.id
          ? {
              ...item,
              currentVersionId: version.id,
              currentVersion: version.number,
              status: 'in-review' as const,
              commentCount: nextComments.filter((comment) => comment.materialId === item.id).length,
              unresolvedCommentCount: copied.length,
              updatedAt: timestamp,
            }
          : item,
      )
      setMaterialVersions(nextVersions)
      localStorageService.set(storageKeys.materialVersions, nextVersions)
      persistReview(nextMaterials, nextComments)
      pushActivity({
        action: `publicou a versão ${version.number}`,
        target: material.name,
        tone: 'brand',
        materialId: material.id,
        versionId: version.id,
      })
      return version
    },
    setCurrentVersion(materialId, versionId) {
      const version = materialVersions.find(
        (item) => item.id === versionId && item.materialId === materialId,
      )
      if (!version) return
      persistReview(
        materials.map((item) =>
          item.id === materialId
            ? {
                ...item,
                currentVersionId: version.id,
                currentVersion: version.number,
                updatedAt: now(),
              }
            : item,
        ),
        comments,
      )
    },
    addComment(input) {
      const timestamp = now()
      const comment: ReviewComment = {
        id: id('comment'),
        materialId: input.materialId,
        versionId: input.versionId,
        authorId: input.authorId ?? 'user-marina',
        authorName: input.authorName ?? 'Marina',
        text: input.text.trim(),
        x: Math.min(1, Math.max(0, input.x)),
        y: Math.min(1, Math.max(0, input.y)),
        status: 'open',
        createdAt: timestamp,
        updatedAt: timestamp,
        replies: [],
        originCommentId: input.originCommentId,
      }
      const nextComments = [...comments, comment]
      const nextMaterials = materials.map((item) =>
        item.id === comment.materialId
          ? {
              ...item,
              status: item.status === 'approved' ? ('in-review' as const) : item.status,
              commentCount: nextComments.filter((entry) => entry.materialId === item.id).length,
              unresolvedCommentCount: nextComments.filter(
                (entry) => entry.materialId === item.id && entry.status === 'open',
              ).length,
              updatedAt: timestamp,
            }
          : item,
      )
      persistReview(nextMaterials, nextComments)
      const material = materials.find((item) => item.id === comment.materialId)
      pushActivity({
        action: 'adicionou um comentário',
        target: material?.name ?? 'Material',
        tone: 'neutral',
        materialId: comment.materialId,
        versionId: comment.versionId,
      })
      return comment
    },
    updateComment(commentId, text) {
      persistReview(
        materials,
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, text: text.trim(), updatedAt: now() } : comment,
        ),
      )
    },
    deleteComment(commentId) {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment) return
      const nextComments = comments.filter((item) => item.id !== commentId)
      const nextMaterials = materials.map((item) =>
        item.id === comment.materialId
          ? {
              ...item,
              commentCount: nextComments.filter((entry) => entry.materialId === item.id).length,
              unresolvedCommentCount: nextComments.filter(
                (entry) => entry.materialId === item.id && entry.status === 'open',
              ).length,
              updatedAt: now(),
            }
          : item,
      )
      persistReview(nextMaterials, nextComments)
    },
    resolveComment(commentId) {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment) return
      const nextComments = comments.map((item) =>
        item.id === commentId ? { ...item, status: 'resolved' as const, updatedAt: now() } : item,
      )
      const nextMaterials = materials.map((item) =>
        item.id === comment.materialId
          ? {
              ...item,
              unresolvedCommentCount: nextComments.filter(
                (entry) => entry.materialId === item.id && entry.status === 'open',
              ).length,
              updatedAt: now(),
            }
          : item,
      )
      persistReview(nextMaterials, nextComments)
      pushActivity({
        action: 'resolveu um comentário',
        target: materials.find((item) => item.id === comment.materialId)?.name ?? 'Material',
        tone: 'approval',
        materialId: comment.materialId,
        versionId: comment.versionId,
      })
    },
    reopenComment(commentId) {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment) return
      const nextComments = comments.map((item) =>
        item.id === commentId ? { ...item, status: 'open' as const, updatedAt: now() } : item,
      )
      const nextMaterials = materials.map((item) =>
        item.id === comment.materialId
          ? {
              ...item,
              unresolvedCommentCount: nextComments.filter(
                (entry) => entry.materialId === item.id && entry.status === 'open',
              ).length,
              updatedAt: now(),
            }
          : item,
      )
      persistReview(nextMaterials, nextComments)
      pushActivity({
        action: 'reabriu um comentário',
        target: materials.find((item) => item.id === comment.materialId)?.name ?? 'Material',
        tone: 'revision',
        materialId: comment.materialId,
        versionId: comment.versionId,
      })
    },
    addCommentReply(commentId, text, authorName = 'Marina') {
      const comment = comments.find((item) => item.id === commentId)
      if (!comment || !text.trim()) return
      const nextComments = comments.map((item) =>
        item.id === commentId
          ? {
              ...item,
              updatedAt: now(),
              replies: [
                ...item.replies,
                {
                  id: id('reply'),
                  commentId,
                  authorId: 'user-marina',
                  authorName,
                  text: text.trim(),
                  createdAt: now(),
                },
              ],
            }
          : item,
      )
      persistReview(materials, nextComments)
      pushActivity({
        action: 'adicionou uma resposta',
        target: materials.find((item) => item.id === comment.materialId)?.name ?? 'Material',
        tone: 'neutral',
        materialId: comment.materialId,
        versionId: comment.versionId,
      })
    },
    requestChanges(materialId) {
      const material = materials.find((item) => item.id === materialId)
      if (!material) return false
      const open = comments.filter(
        (comment) =>
          comment.materialId === materialId &&
          comment.versionId === material.currentVersionId &&
          comment.status === 'open',
      )
      if (!open.length) return false
      persistReview(
        materials.map((item) =>
          item.id === materialId
            ? { ...item, status: 'changes-requested' as const, updatedAt: now() }
            : item,
        ),
        comments,
      )
      pushActivity({
        action: 'solicitou alterações',
        target: material.name,
        tone: 'revision',
        materialId,
        versionId: material.currentVersionId,
      })
      return true
    },
    approveVersion(materialId, versionId, approvedBy = 'Marina') {
      const material = materials.find((item) => item.id === materialId)
      const approval: Approval = {
        id: id('approval'),
        materialId,
        versionId,
        approvedBy,
        approvedAt: now(),
      }
      const nextApprovals = [...approvals, approval]
      const nextVersions = materialVersions.map((item) =>
        item.id === versionId ? { ...item, approved: true, approvalId: approval.id } : item,
      )
      setApprovals(nextApprovals)
      setMaterialVersions(nextVersions)
      localStorageService.set(storageKeys.approvals, nextApprovals)
      localStorageService.set(storageKeys.materialVersions, nextVersions)
      persistReview(
        materials.map((item) =>
          item.id === materialId
            ? { ...item, status: 'approved' as const, updatedAt: now() }
            : item,
        ),
        comments,
      )
      pushActivity({
        action: 'aprovou a versão',
        target: material?.name ?? 'Material',
        tone: 'approval',
        materialId,
        versionId,
      })
      return approval
    },
    reopenReview(materialId) {
      const material = materials.find((item) => item.id === materialId)
      if (!material) return
      persistReview(
        materials.map((item) =>
          item.id === materialId
            ? { ...item, status: 'in-review' as const, updatedAt: now() }
            : item,
        ),
        comments,
      )
      pushActivity({
        action: 'reabriu a revisão',
        target: material.name,
        tone: 'brand',
        materialId,
        versionId: material.currentVersionId,
      })
    },
    addActivity: pushActivity,
    restoreDemo() {
      setWorkspace(demoWorkspace)
      setClients(demoClients)
      setProjects(demoProjects)
      setTeam(demoTeam)
      setOnboarding(emptyOnboarding)
      setMaterials(demoMaterials)
      setMaterialVersions(demoVersions)
      setComments(demoComments)
      setApprovals(demoApprovals)
      setActivities(demoActivities)
      setNotifications(demoNotifications)
      const entries = [
        [storageKeys.workspace, demoWorkspace],
        [storageKeys.clients, demoClients],
        [storageKeys.projects, demoProjects],
        [storageKeys.team, demoTeam],
        [storageKeys.onboarding, emptyOnboarding],
        [storageKeys.materials, demoMaterials],
        [storageKeys.materialVersions, demoVersions],
        [storageKeys.comments, demoComments],
        [storageKeys.approvals, demoApprovals],
        [storageKeys.activities, demoActivities],
        [storageKeys.notifications, demoNotifications],
      ] as const
      entries.forEach(([key, data]) => localStorageService.set(key, data))
    },
  }
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return value
}
