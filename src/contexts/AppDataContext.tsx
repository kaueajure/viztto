import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { demoClients } from '@/data/mock/clients'
import { demoProjects } from '@/data/mock/projects'
import { demoTeam } from '@/data/mock/users'
import { demoWorkspace } from '@/data/mock/workspace'
import { localStorageService, storageKeys } from '@/services/localStorageService'
import type { Client, OnboardingState, Project, TeamMember, Workspace } from '@/types/domain'

type NewClient = Pick<Client, 'name'> &
  Partial<Pick<Client, 'company' | 'email' | 'phone' | 'notes' | 'color'>>
type NewProject = Pick<Project, 'name' | 'clientId'> &
  Partial<Pick<Project, 'description' | 'type' | 'dueDate' | 'members'>>
type AppDataValue = {
  workspace: Workspace
  clients: Client[]
  projects: Project[]
  team: TeamMember[]
  onboarding: OnboardingState
  updateOnboarding: (patch: Partial<OnboardingState>) => void
  updateWorkspace: (patch: Partial<Workspace>) => void
  addClient: (client: NewClient) => Client
  addProject: (project: NewProject) => Project
  addTeamMember: (member: Pick<TeamMember, 'name' | 'email' | 'role'>) => void
  restoreDemo: () => void
}

const AppDataContext = createContext<AppDataValue | null>(null)
const emptyOnboarding: OnboardingState = { workspaceName: '', slug: '', profile: '', role: '' }

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

  const value = useMemo<AppDataValue>(
    () => ({
      workspace,
      clients,
      projects,
      team,
      onboarding,
      updateOnboarding(patch) {
        setOnboarding((current) => {
          const next = { ...current, ...patch }
          localStorageService.set(storageKeys.onboarding, next)
          return next
        })
      },
      updateWorkspace(patch) {
        setWorkspace((current) => {
          const next = { ...current, ...patch }
          localStorageService.set(storageKeys.workspace, next)
          return next
        })
      },
      addClient(input) {
        const now = new Date().toISOString()
        const client: Client = {
          id: `client-${Date.now()}`,
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
          createdAt: now,
          updatedAt: now,
        }
        setClients((current) => {
          const next = [client, ...current]
          localStorageService.set(storageKeys.clients, next)
          return next
        })
        return client
      },
      addProject(input) {
        const project: Project = {
          id: `project-${Date.now()}`,
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
          updatedAt: new Date().toISOString(),
        }
        setProjects((current) => {
          const next = [project, ...current]
          localStorageService.set(storageKeys.projects, next)
          return next
        })
        setClients((current) => {
          const next = current.map((client) =>
            client.id === project.clientId
              ? { ...client, projectCount: client.projectCount + 1 }
              : client,
          )
          localStorageService.set(storageKeys.clients, next)
          return next
        })
        return project
      },
      addTeamMember(input) {
        const member: TeamMember = {
          id: `member-${Date.now()}`,
          workspaceId: workspace.id,
          ...input,
          projectCount: 0,
          status: 'invited',
          lastAccess: 'Convite enviado',
        }
        setTeam((current) => {
          const next = [...current, member]
          localStorageService.set(storageKeys.team, next)
          return next
        })
      },
      restoreDemo() {
        setWorkspace(demoWorkspace)
        setClients(demoClients)
        setProjects(demoProjects)
        setTeam(demoTeam)
        setOnboarding(emptyOnboarding)
        localStorageService.set(storageKeys.workspace, demoWorkspace)
        localStorageService.set(storageKeys.clients, demoClients)
        localStorageService.set(storageKeys.projects, demoProjects)
        localStorageService.set(storageKeys.team, demoTeam)
        localStorageService.set(storageKeys.onboarding, emptyOnboarding)
      },
    }),
    [workspace, clients, projects, team, onboarding],
  )
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return value
}
