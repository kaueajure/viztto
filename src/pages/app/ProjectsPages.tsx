import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  MaterialStatus,
  PageHeader,
  ProjectProgress,
  ProjectStatusBadge,
  SearchField,
} from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { AvatarGroup, EmptyState } from '@/components/ui/DataDisplay'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import { Modal, Tabs } from '@/components/ui/Interactive'
import { useAppData } from '@/contexts/AppDataContext'
import { demoMaterials } from '@/data/mock/materials'
import type { ProjectStatus } from '@/types/domain'

const filters: Array<[string, ProjectStatus | 'all']> = [
  ['Todos', 'all'],
  ['Em revisão', 'in-review'],
  ['Alterações solicitadas', 'changes-requested'],
  ['Aguardando aprovação', 'waiting-approval'],
  ['Aprovados', 'approved'],
  ['Arquivados', 'archived'],
]

export function ProjectsPage() {
  const { projects, clients } = useAppData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [client, setClient] = useState('all')
  const filtered = projects.filter(
    (project) =>
      (filter === 'all' || project.status === filter) &&
      (client === 'all' || project.clientId === client) &&
      project.name.toLowerCase().includes(query.toLowerCase()),
  )
  const clientName = (id: string) => clients.find((item) => item.id === id)?.name ?? 'Cliente'
  return (
    <div>
      <PageHeader
        title="Projetos"
        description="Acompanhe materiais, versões, comentários e decisões."
        action={{ label: 'Novo projeto', to: '/app/projetos/novo' }}
      />
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-10 whitespace-nowrap rounded-full border px-3 text-sm ${filter === value ? 'border-brand bg-brand-soft text-brand' : 'border-line text-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_15rem]">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar projetos" />
        <select
          value={client}
          onChange={(e) => setClient(e.target.value)}
          aria-label="Filtrar por cliente"
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Todos os clientes</option>
          {clients.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="hidden grid-cols-[1.2fr_.8fr_auto_auto_auto] gap-4 border-b border-line bg-surface-secondary p-4 text-xs text-muted lg:grid">
          <span>Projeto</span>
          <span>Progresso</span>
          <span>Status</span>
          <span>Equipe</span>
          <span>Prazo</span>
        </div>
        <div className="divide-y divide-line">
          {filtered.map((project) => (
            <Link
              to={`/app/projetos/${project.id}`}
              key={project.id}
              className="grid gap-4 p-4 hover:bg-surface-secondary lg:grid-cols-[1.2fr_.8fr_auto_auto_auto] lg:items-center"
            >
              <div>
                <p className="font-semibold">{project.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {clientName(project.clientId)} · {project.materialCount} materiais ·{' '}
                  {project.commentCount} abertos
                </p>
              </div>
              <ProjectProgress value={project.progress} />
              <ProjectStatusBadge status={project.status} />
              <AvatarGroup names={project.members.slice(0, 3)} />
              <span className="text-xs text-secondary">
                {project.dueDate
                  ? new Date(project.dueDate).toLocaleDateString('pt-BR')
                  : 'Sem prazo'}
              </span>
            </Link>
          ))}
          {!filtered.length && (
            <div className="p-6">
              <EmptyState
                title="Nenhum projeto encontrado"
                description="Ajuste a busca ou os filtros utilizados."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function NewProjectPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { clients, addProject } = useAppData()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    clientId: params.get('client') ?? clients[0]?.id ?? '',
    description: '',
    type: 'Campanha',
    dueDate: '',
    members: 'Marina, Rafael',
  })
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.clientId) return
    const project = addProject({
      ...form,
      members: form.members
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    })
    setSaved(true)
    window.setTimeout(() => navigate(`/app/projetos/${project.id}`), 350)
  }
  return (
    <div>
      <PageHeader
        title="Novo projeto"
        description="Defina o contexto antes de adicionar materiais e aprovadores."
      />
      <form
        onSubmit={submit}
        className="mt-7 max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input required label="Nome" value={form.name} onChange={set('name')} />
          <Select required label="Cliente" value={form.clientId} onChange={set('clientId')}>
            <option value="">Selecione</option>
            {clients.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Tipo" value={form.type} onChange={set('type')}>
            {['Campanha', 'Redes sociais', 'Vídeo', 'Apresentação', 'Site', 'Outro'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Input label="Prazo" type="date" value={form.dueDate} onChange={set('dueDate')} />
          <Input
            label="Responsáveis"
            hint="Separe os nomes por vírgula."
            value={form.members}
            onChange={set('members')}
          />
          <Input label="Aprovadores" placeholder="Bianca, cliente" />
          <div className="sm:col-span-2">
            <Textarea label="Descrição" value={form.description} onChange={set('description')} />
          </div>
        </div>
        {saved && (
          <p role="status" className="mt-4 text-sm text-approval">
            Projeto criado com sucesso.
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button type="submit">Criar projeto</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/app/projetos')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { projects, clients } = useAppData()
  const [materialModal, setMaterialModal] = useState(false)
  const [added, setAdded] = useState(false)
  const project = projects.find((item) => item.id === projectId)
  if (!project)
    return (
      <EmptyState
        title="Projeto não encontrado"
        description="Este projeto não está disponível no workspace atual."
      />
    )
  const client = clients.find((item) => item.id === project.clientId)
  const materials = demoMaterials.filter((item) => item.projectId === project.id)
  const overview = (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div>
        <h2 className="font-semibold text-ink">Resumo</h2>
        <p className="mt-2 leading-relaxed">
          {project.description ||
            'Fluxo de revisão organizado por materiais, versões e responsáveis.'}
        </p>
        <div className="mt-6">
          <ProjectProgress value={project.progress} />
        </div>
      </div>
      <div className="rounded-md border border-line bg-surface-secondary p-4">
        <p className="text-xs text-muted">Pendências</p>
        <p className="mt-2 text-2xl font-semibold text-revision">{project.commentCount}</p>
        <p className="mt-1 text-xs">comentários abertos</p>
      </div>
    </div>
  )
  const materialList = (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setMaterialModal(true)}>Adicionar material</Button>
      </div>
      <div className="divide-y divide-line rounded-md border border-line">
        {materials.map((material) => (
          <Link
            className="flex items-center justify-between gap-4 p-4 hover:bg-surface-secondary"
            to={`/app/materiais/${material.id}`}
            key={material.id}
          >
            <div>
              <p className="font-semibold text-ink">{material.name}</p>
              <p className="mt-1 text-xs">
                {material.type} · v{material.currentVersion} · {material.commentCount} comentários
              </p>
            </div>
            <MaterialStatus status={material.status} />
          </Link>
        ))}
        {!materials.length && <p className="p-5">Nenhum material adicionado.</p>}
      </div>
    </div>
  )
  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{client?.name}</p>
          <h1 className="mt-1 text-3xl font-semibold">{project.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ProjectStatusBadge status={project.status} />
            <span className="text-sm text-secondary">
              Prazo{' '}
              {project.dueDate
                ? new Date(project.dueDate).toLocaleDateString('pt-BR')
                : 'não definido'}
            </span>
            <AvatarGroup names={project.members} />
          </div>
        </div>
        <Button onClick={() => setMaterialModal(true)}>Adicionar material</Button>
      </div>
      <div className="mt-6 rounded-lg border border-line bg-surface px-5">
        <Tabs
          items={[
            { label: 'Visão geral', content: overview },
            { label: 'Materiais', content: materialList },
            {
              label: 'Atividade',
              content: <p>Atividades deste projeto serão registradas aqui.</p>,
            },
            { label: 'Participantes', content: <p>{project.members.join(', ')}</p> },
            { label: 'Configurações', content: <p>Preferências locais do projeto.</p> },
          ]}
        />
      </div>
      <Modal
        open={materialModal}
        onClose={() => setMaterialModal(false)}
        title="Adicionar material"
      >
        <div className="grid gap-4">
          <Input label="Nome do material" placeholder="Ex.: Post principal" />
          <Select label="Formato">
            <option>Imagem</option>
            <option>Vídeo</option>
            <option>PDF</option>
            <option>Apresentação</option>
            <option>Página</option>
          </Select>
          {added && (
            <p role="status" className="text-sm text-approval">
              Material fictício adicionado ao fluxo.
            </p>
          )}
          <Button
            onClick={() => {
              setAdded(true)
              window.setTimeout(() => setMaterialModal(false), 500)
            }}
          >
            Adicionar material fictício
          </Button>
        </div>
      </Modal>
    </div>
  )
}
