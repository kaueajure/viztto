import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  MaterialStatus,
  PageHeader,
  ProjectProgress,
  ProjectStatusBadge,
  SearchField,
} from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { AvatarGroup, EmptyState } from '@/components/ui/DataDisplay'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/FormControls'
import { Modal, Tabs } from '@/components/ui/Interactive'
import { ActivityPanel } from '@/components/review/ActivityPanel'
import { useAppData } from '@/contexts/AppDataContext'
import { assinaturasApi } from '@/services/api/assinaturasApi'
import { dadosApi } from '@/services/api/dadosApi'
import type { ProjectStatus, TeamMember } from '@/types/domain'

const filters: Array<[string, ProjectStatus | 'all']> = [
  ['Todos', 'all'],
  ['Em revisão', 'in-review'],
  ['Alterações solicitadas', 'changes-requested'],
  ['Aguardando aprovação', 'waiting-approval'],
  ['Aprovados', 'approved'],
  ['Arquivados', 'archived'],
]

function ParticipantPicker({
  membros,
  memberIds,
  approverIds,
  variosAprovadores,
  onChangeMembers,
  onChangeApprovers,
}: {
  membros: TeamMember[]
  memberIds: string[]
  approverIds: string[]
  variosAprovadores: boolean
  onChangeMembers: (ids: string[]) => void
  onChangeApprovers: (ids: string[]) => void
}) {
  const toggle = (
    lista: string[],
    id: string,
    checked: boolean,
    single: boolean,
    onChange: (ids: string[]) => void,
  ) => {
    if (!checked) {
      onChange(lista.filter((item) => item !== id))
      return
    }
    onChange(single ? [id] : [...lista.filter((item) => item !== id), id])
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
      <div>
        <p className="text-sm font-medium text-ink">Responsáveis</p>
        <p className="mt-1 text-xs text-secondary">Membros que acompanham o projeto.</p>
        <div className="mt-3 grid gap-2">
          {membros.map((membro) => (
            <Checkbox
              key={`resp-${membro.id}`}
              label={membro.name}
              checked={memberIds.includes(membro.id)}
              onChange={(checked) => toggle(memberIds, membro.id, checked, false, onChangeMembers)}
            />
          ))}
          {!membros.length && <p className="text-sm text-muted">Nenhum membro ativo.</p>}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Aprovadores</p>
        <p className="mt-1 text-xs text-secondary">
          {variosAprovadores
            ? 'Selecione um ou mais aprovadores.'
            : 'Seu plano permite um aprovador por projeto.'}
        </p>
        <div className="mt-3 grid gap-2">
          {membros.map((membro) => (
            <Checkbox
              key={`aprov-${membro.id}`}
              label={membro.name}
              checked={approverIds.includes(membro.id)}
              onChange={(checked) =>
                toggle(approverIds, membro.id, checked, !variosAprovadores, onChangeApprovers)
              }
            />
          ))}
          {!membros.length && <p className="text-sm text-muted">Nenhum membro ativo.</p>}
        </div>
      </div>
    </div>
  )
}

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
        description="Materiais e revisões"
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
              <AvatarGroup names={[...project.members, ...project.approvers].slice(0, 3)} />
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
  const { clients, team, addProject } = useAppData()
  const membrosAtivos = team.filter((item) => item.status === 'active')
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState('')
  const [variosAprovadores, setVariosAprovadores] = useState(false)
  const [form, setForm] = useState({
    name: '',
    clientId: params.get('client') ?? clients[0]?.id ?? '',
    description: '',
    type: 'Campanha',
    dueDate: '',
    memberIds: [] as string[],
    approverIds: [] as string[],
  })
  useEffect(() => {
    void assinaturasApi
      .limites()
      .then(({ dado }) => setVariosAprovadores(Boolean(dado.recursos.permiteVariosAprovadores)))
      .catch(() => setVariosAprovadores(false))
  }, [])
  const set =
    (key: 'name' | 'clientId' | 'description' | 'type' | 'dueDate') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const nomes = (ids: string[]) =>
    ids
      .map((id) => membrosAtivos.find((membro) => membro.id === id)?.name)
      .filter((nome): nome is string => Boolean(nome))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.clientId) return
    setErro('')
    try {
      const project = await addProject({
        name: form.name,
        clientId: form.clientId,
        description: form.description,
        type: form.type,
        dueDate: form.dueDate,
        memberIds: form.memberIds,
        approverIds: form.approverIds,
        members: nomes(form.memberIds),
        approvers: nomes(form.approverIds),
      })
      setSaved(true)
      window.setTimeout(() => navigate(`/app/projetos/${project.id}`), 350)
    } catch (falha) {
      setSaved(false)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível criar o projeto.')
    }
  }
  return (
    <div>
      <PageHeader title="Novo projeto" description="Informações iniciais do projeto" />
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
          <ParticipantPicker
            membros={membrosAtivos}
            memberIds={form.memberIds}
            approverIds={form.approverIds}
            variosAprovadores={variosAprovadores}
            onChangeMembers={(memberIds) => setForm((atual) => ({ ...atual, memberIds }))}
            onChangeApprovers={(approverIds) => setForm((atual) => ({ ...atual, approverIds }))}
          />
          <div className="sm:col-span-2">
            <Textarea label="Descrição" value={form.description} onChange={set('description')} />
          </div>
        </div>
        {saved && (
          <p role="status" className="mt-4 text-sm text-approval">
            Projeto criado.
          </p>
        )}
        {erro && (
          <p role="alert" className="mt-4 text-sm text-revision">
            {erro}
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
  const {
    projects,
    clients,
    team,
    materials: allMaterials,
    activities,
    addMaterial,
    updateProjectParticipants,
  } = useAppData()
  const membrosAtivos = team.filter((item) => item.status === 'active')
  const [materialModal, setMaterialModal] = useState(false)
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'image' })
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [materialSubmitting, setMaterialSubmitting] = useState(false)
  const [materialError, setMaterialError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [shareError, setShareError] = useState('')
  const [variosAprovadores, setVariosAprovadores] = useState(false)
  const [editandoParticipantes, setEditandoParticipantes] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [approverIds, setApproverIds] = useState<string[]>([])
  const [participantesMsg, setParticipantesMsg] = useState('')
  const [participantesErro, setParticipantesErro] = useState('')
  const [salvandoParticipantes, setSalvandoParticipantes] = useState(false)
  const project = projects.find((item) => item.id === projectId)

  useEffect(() => {
    void assinaturasApi
      .limites()
      .then(({ dado }) => setVariosAprovadores(Boolean(dado.recursos.permiteVariosAprovadores)))
      .catch(() => setVariosAprovadores(false))
  }, [])
  useEffect(() => {
    if (!project) return
    setMemberIds(project.memberIds ?? [])
    setApproverIds(project.approverIds ?? [])
  }, [project?.id, project?.memberIds, project?.approverIds])

  if (!project)
    return (
      <EmptyState
        title="Projeto não encontrado"
        description="Este projeto não está disponível no workspace atual."
      />
    )
  const client = clients.find((item) => item.id === project.clientId)
  const materials = allMaterials.filter((item) => item.projectId === project.id)
  const projectActivities = activities.filter((item) => item.projectId === project.id)
  const equipeVisivel = [...project.members, ...project.approvers]

  const compartilharLink = async () => {
    setShareMessage('')
    setShareError('')
    try {
      const { dado } = await dadosApi.linkPortal(project.id)
      try {
        await navigator.clipboard.writeText(dado.link)
        setShareMessage('Link copiado')
      } catch {
        setShareMessage(dado.link)
        setShareError('Não foi possível copiar. Selecione e copie o link acima.')
      }
    } catch (erro) {
      setShareError(erro instanceof Error ? erro.message : 'Não foi possível gerar o link.')
    }
  }

  const salvarParticipantes = async () => {
    setParticipantesMsg('')
    setParticipantesErro('')
    setSalvandoParticipantes(true)
    try {
      await updateProjectParticipants(project.id, { memberIds, approverIds })
      setParticipantesMsg('Participantes atualizados.')
      setEditandoParticipantes(false)
    } catch (falha) {
      setParticipantesErro(
        falha instanceof Error ? falha.message : 'Não foi possível salvar os participantes.',
      )
    } finally {
      setSalvandoParticipantes(false)
    }
  }

  const overview = (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div>
        <h2 className="font-semibold text-ink">Resumo</h2>
        <p className="mt-2 leading-relaxed">{project.description || 'Sem descrição.'}</p>
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
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => void compartilharLink()}>
            Compartilhar link
          </Button>
          <Button onClick={() => setMaterialModal(true)}>Adicionar material</Button>
        </div>
      </div>
      {shareMessage && (
        <p role="status" className="mb-3 text-sm text-approval">
          {shareMessage}
        </p>
      )}
      {shareError && (
        <p role="alert" className="mb-3 text-sm text-revision">
          {shareError}
        </p>
      )}
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
  const participantes = (
    <div className="space-y-4">
      {!editandoParticipantes ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Responsáveis</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {project.members.map((nome) => (
                  <li key={nome}>{nome}</li>
                ))}
                {!project.members.length && <li className="text-muted">Nenhum responsável.</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Aprovadores</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {project.approvers.map((nome) => (
                  <li key={nome}>{nome}</li>
                ))}
                {!project.approvers.length && <li className="text-muted">Nenhum aprovador.</li>}
              </ul>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMemberIds(project.memberIds ?? [])
              setApproverIds(project.approverIds ?? [])
              setEditandoParticipantes(true)
              setParticipantesMsg('')
              setParticipantesErro('')
            }}
          >
            Editar participantes
          </Button>
        </>
      ) : (
        <>
          <ParticipantPicker
            membros={membrosAtivos}
            memberIds={memberIds}
            approverIds={approverIds}
            variosAprovadores={variosAprovadores}
            onChangeMembers={setMemberIds}
            onChangeApprovers={setApproverIds}
          />
          <div className="flex flex-wrap gap-3">
            <Button loading={salvandoParticipantes} onClick={() => void salvarParticipantes()}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditandoParticipantes(false)
                setMemberIds(project.memberIds ?? [])
                setApproverIds(project.approverIds ?? [])
              }}
            >
              Cancelar
            </Button>
          </div>
        </>
      )}
      {participantesMsg && (
        <p role="status" className="text-sm text-approval">
          {participantesMsg}
        </p>
      )}
      {participantesErro && (
        <p role="alert" className="text-sm text-revision">
          {participantesErro}
        </p>
      )}
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
            <AvatarGroup names={equipeVisivel} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void compartilharLink()}>
            Compartilhar link
          </Button>
          <Button onClick={() => setMaterialModal(true)}>Adicionar material</Button>
        </div>
      </div>
      {(shareMessage || shareError) && (
        <p
          role={shareError ? 'alert' : 'status'}
          className={`mt-4 text-sm ${shareError ? 'text-revision' : 'text-approval'}`}
        >
          {shareError || shareMessage}
        </p>
      )}
      <div className="mt-6 rounded-lg border border-line bg-surface px-5">
        <Tabs
          items={[
            { label: 'Visão geral', content: overview },
            { label: 'Materiais', content: materialList },
            {
              label: 'Atividade',
              content: (
                <ActivityPanel
                  activities={projectActivities}
                  emptyLabel="Nenhuma atividade registrada neste projeto."
                />
              ),
            },
            { label: 'Participantes', content: participantes },
            {
              label: 'Configurações',
              content: <p>Configure o portal em Configurações → Portal.</p>,
            },
          ]}
        />
      </div>
      <Modal
        open={materialModal}
        onClose={() => setMaterialModal(false)}
        title="Adicionar material"
      >
        <div className="grid gap-4">
          <Input
            label="Nome do material"
            placeholder="Ex.: Post principal"
            value={materialForm.name}
            onChange={(event) => setMaterialForm({ ...materialForm, name: event.target.value })}
          />
          <Select
            label="Formato"
            value={materialForm.type}
            onChange={(event) => setMaterialForm({ ...materialForm, type: event.target.value })}
          >
            <option value="image">Imagem</option>
            <option value="video">Vídeo</option>
            <option value="pdf">PDF</option>
          </Select>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Primeiro envio
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
              className="min-h-11 rounded-md border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand"
              onChange={(event) => {
                setMaterialFile(event.target.files?.[0] ?? null)
                setMaterialError('')
              }}
            />
            <span className="text-xs font-normal text-secondary">
              JPEG, PNG, WebP, PDF, MP4, WebM ou MOV. Limite de 100 MB.
            </span>
          </label>
          {materialError && <p className="text-sm text-revision">{materialError}</p>}
          <Button
            disabled={!materialForm.name.trim() || !materialFile}
            loading={materialSubmitting}
            onClick={async () => {
              if (!materialFile) return
              setMaterialSubmitting(true)
              setMaterialError('')
              try {
                await addMaterial({
                  projectId: project.id,
                  name: materialForm.name.trim(),
                  type: materialForm.type as 'image' | 'video' | 'pdf',
                  file: materialFile,
                })
                setMaterialForm({ name: '', type: 'image' })
                setMaterialFile(null)
                setMaterialModal(false)
              } catch (error) {
                setMaterialError(
                  error instanceof Error ? error.message : 'Não foi possível adicionar o material.',
                )
              } finally {
                setMaterialSubmitting(false)
              }
            }}
          >
            Adicionar material
          </Button>
        </div>
      </Modal>
    </div>
  )
}
