import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { carregarDadosApi, dadosApi } from '@/services/api/dadosApi'
import type {
  Activity,
  Approval,
  Client,
  Material,
  MaterialVersion,
  Notification,
  OnboardingState,
  Project,
  ReviewComment,
  TeamMember,
  Workspace,
} from '@/types/domain'

type NewClient = Pick<Client, 'name'> &
  Partial<Pick<Client, 'company' | 'email' | 'phone' | 'notes' | 'color'>>
type NewProject = Pick<Project, 'name' | 'clientId'> &
  Partial<Pick<Project, 'description' | 'type' | 'dueDate' | 'members'>>
type NewMaterial = Pick<Material, 'name' | 'projectId' | 'type'> & { file: File }
type NewComment = Pick<ReviewComment, 'materialId' | 'versionId' | 'text' | 'x' | 'y'>
type NewVersion = Pick<MaterialVersion, 'materialId' | 'label'> &
  Partial<Pick<MaterialVersion, 'description'>> & { copyPending?: boolean; file: File }
type Estado = {
  workspace: Workspace
  clients: Client[]
  projects: Project[]
  team: TeamMember[]
  materials: Material[]
  materialVersions: MaterialVersion[]
  comments: ReviewComment[]
  approvals: Approval[]
  activities: Activity[]
  notifications: Notification[]
}
type Valor = Estado & {
  onboarding: OnboardingState
  loading: boolean
  error: string
  refresh: () => Promise<void>
  updateOnboarding: (p: Partial<OnboardingState>) => void
  updateWorkspace: (p: Partial<Workspace>) => void
  addClient: (d: NewClient) => Promise<Client>
  addProject: (d: NewProject) => Promise<Project>
  addTeamMember: (d: Pick<TeamMember, 'email' | 'role'>) => Promise<void>
  addMaterial: (d: NewMaterial) => Promise<Material>
  updateMaterial: (id: string, p: Partial<Material>) => Promise<void>
  addMaterialVersion: (d: NewVersion) => Promise<MaterialVersion>
  setCurrentVersion: (id: string, v: string) => void
  addComment: (d: NewComment) => Promise<ReviewComment>
  updateComment: (id: string, t: string) => Promise<void>
  deleteComment: (id: string) => Promise<void>
  resolveComment: (id: string) => Promise<void>
  reopenComment: (id: string) => Promise<void>
  addCommentReply: (id: string, t: string) => Promise<void>
  requestChanges: (id: string, versionId: string) => Promise<boolean>
  approveVersion: (id: string, v: string) => Promise<Approval>
  reopenReview: (id: string) => Promise<void>
  addActivity: () => never
}
const vazio: Estado = {
  workspace: { id: '', name: 'Workspace', slug: '', plan: 'gratuito', createdAt: '' },
  clients: [],
  projects: [],
  team: [],
  materials: [],
  materialVersions: [],
  comments: [],
  approvals: [],
  activities: [],
  notifications: [],
}
const inicialOnboarding: OnboardingState = { workspaceName: '', slug: '', profile: '', role: '' }
const Contexto = createContext<Valor | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [estado, setEstado] = useState<Estado>(vazio)
  const [onboarding, setOnboarding] = useState(inicialOnboarding)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = async () => {
    try {
      setEstado({ ...(await carregarDadosApi()), approvals: [] })
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!user?.workspaceId) {
      setLoading(false)
      return
    }
    void refresh()
  }, [user?.workspaceId])
  const value = useMemo<Valor>(
    () => ({
      ...estado,
      onboarding,
      loading,
      error,
      refresh,
      updateOnboarding(p) {
        setOnboarding((a) => ({ ...a, ...p }))
      },
      updateWorkspace(p) {
        setEstado((a) => ({ ...a, workspace: { ...a.workspace, ...p } }))
      },
      async addClient(d) {
        const r = await dadosApi.cliente(d)
        const client: Client = {
          ...d,
          id: r.dado.id,
          workspaceId: estado.workspace.id,
          status: 'active',
          projectCount: 0,
          pendingApprovals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setEstado((atual) => ({
          ...atual,
          clients: [...atual.clients.filter((item) => item.id !== client.id), client],
        }))
        try {
          await refresh()
        } catch {
          /* mantém o cliente otimista se o reload falhar */
        }
        return client
      },
      async addProject(d) {
        const r = await dadosApi.projeto(d)
        const project: Project = {
          id: r.dado.id,
          clientId: d.clientId,
          name: d.name,
          description: d.description,
          type: d.type ?? 'Campanha',
          status: 'in-review',
          dueDate: d.dueDate,
          progress: 0,
          materialCount: 0,
          commentCount: 0,
          members: d.members ?? [],
          updatedAt: new Date().toISOString(),
        }
        setEstado((atual) => ({
          ...atual,
          projects: [...atual.projects.filter((item) => item.id !== project.id), project],
        }))
        try {
          await refresh()
        } catch {
          /* mantém o projeto otimista se o reload falhar */
        }
        return project
      },
      async addTeamMember(d) {
        await dadosApi.convidarMembro(d)
        await refresh()
      },
      async addMaterial(d) {
        const r = await dadosApi.material(d)
        await refresh()
        return {
          id: r.dado.id,
          ...d,
          status: 'draft',
          currentVersionId: r.dado.versaoId,
          currentVersion: 1,
          commentCount: 0,
          unresolvedCommentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
      async updateMaterial() {
        await refresh()
      },
      async addMaterialVersion(d) {
        const r = await dadosApi.versao(d.materialId, d)
        await refresh()
        const versao = (await carregarDadosApi()).materialVersions.find((v) => v.id === r.dado.id)
        if (!versao) throw new Error('Versão publicada, mas não foi possível recarregá-la.')
        return versao
      },
      setCurrentVersion() {
        /* a versao visualizada pertence ao estado local do editor */
      },
      async addComment(d) {
        const r = await dadosApi.comentario(d)
        await refresh()
        const c = (await carregarDadosApi()).comments.find((x) => x.id === r.dado.id)
        if (!c) throw new Error('Comentário criado, mas não foi possível recarregá-lo.')
        return c
      },
      async updateComment(id, t) {
        await dadosApi.editarComentario(id, t)
        await refresh()
      },
      async deleteComment(id) {
        await dadosApi.excluirComentario(id)
        await refresh()
      },
      async resolveComment(id) {
        await dadosApi.resolver(id)
        await refresh()
      },
      async reopenComment(id) {
        await dadosApi.reabrirComentario(id)
        await refresh()
      },
      async addCommentReply(id, t) {
        await dadosApi.responder(id, t)
        await refresh()
      },
      async requestChanges(id, versionId) {
        try {
          await dadosApi.solicitar(id, versionId)
          await refresh()
          return true
        } catch {
          return false
        }
      },
      async approveVersion(id, versionId) {
        await dadosApi.aprovar(id, versionId)
        await refresh()
        return {
          id: `approval-${Date.now()}`,
          materialId: id,
          versionId,
          approvedBy: user?.name || 'Usuário',
          approvedAt: new Date().toISOString(),
        }
      },
      async reopenReview(id) {
        await dadosApi.reabrir(id)
        await refresh()
      },
      addActivity() {
        throw new Error('Atividades sao criadas exclusivamente pelas transacoes do servidor.')
      },
    }),
    [estado, onboarding, loading, error, user?.name],
  )
  return <Contexto.Provider value={value}>{children}</Contexto.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const value = useContext(Contexto)
  if (!value) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return value
}
