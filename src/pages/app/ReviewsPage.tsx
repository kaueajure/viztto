import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PageHeader, MaterialStatus, SearchField } from '@/components/app/AppUi'
import { Badge, EmptyState } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { materialTypeLabel } from '@/lib/materialType'
import type { Material, MaterialStatus as MaterialStatusType, Project } from '@/types/domain'

type FilaPrincipal =
  | 'precisa-de-mim'
  | 'aguardando-cliente'
  | 'alteracoes'
  | 'em-revisao'
  | 'atrasados'
  | 'concluidos'
  | 'todos'

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(diff / 60_000)
  if (minutos < 60) return `Há ${Math.max(1, minutos)} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 48) return `Há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `Há ${dias} dia${dias === 1 ? '' : 's'}`
}

function atrasado(project?: Project) {
  if (!project?.dueDate) return false
  if (project.status === 'approved' || project.status === 'archived') return false
  return new Date(project.dueDate).getTime() < Date.now()
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const { projects, clients, materials, materialVersions, team } = useAppData()
  const [fila, setFila] = useState<FilaPrincipal>('precisa-de-mim')
  const [busca, setBusca] = useState('')
  const [clienteId, setClienteId] = useState('all')
  const [projetoId, setProjetoId] = useState('all')
  const [responsavelId, setResponsavelId] = useState('all')
  const [aprovadorId, setAprovadorId] = useState('all')
  const [statusFiltro, setStatusFiltro] = useState<MaterialStatusType | 'all'>('all')
  const [tipoFiltro, setTipoFiltro] = useState<'all' | Material['type']>('all')
  const [ordenacao, setOrdenacao] = useState<
    'urgente' | 'prazo' | 'recente' | 'antigo' | 'cliente'
  >('urgente')

  const contexto = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    const client = clients.find((item) => item.id === project?.clientId)
    return { project, client }
  }

  const souAprovadorDe = (project?: Project) =>
    Boolean(user?.id && project?.approverIds.includes(user.id))

  const filas: Array<[FilaPrincipal, string, (m: Material) => boolean]> = [
    [
      'precisa-de-mim',
      'Precisa de mim',
      (m) => {
        const { project } = contexto(m.projectId)
        if (m.status === 'changes-requested') return true
        if (m.status === 'in-review') return true
        if (m.status === 'waiting-approval' && souAprovadorDe(project)) return true
        return false
      },
    ],
    [
      'aguardando-cliente',
      'Aguardando cliente',
      (m) => m.status === 'waiting-approval',
    ],
    ['alteracoes', 'Alterações solicitadas', (m) => m.status === 'changes-requested'],
    ['em-revisao', 'Em revisão', (m) => m.status === 'in-review'],
    [
      'atrasados',
      'Atrasados',
      (m) => atrasado(contexto(m.projectId).project) && m.status !== 'approved',
    ],
    ['concluidos', 'Concluídos', (m) => m.status === 'approved'],
    ['todos', 'Todos', () => true],
  ]

  const contagens = Object.fromEntries(
    filas.map(([id, , pred]) => [id, materials.filter(pred).length]),
  ) as Record<FilaPrincipal, number>

  const predFila = filas.find(([id]) => id === fila)?.[2] ?? (() => true)

  const itens = useMemo(() => {
    let lista = materials.filter((material) => {
      if (!predFila(material)) return false
      const { project, client } = contexto(material.projectId)
      if (clienteId !== 'all' && project?.clientId !== clienteId) return false
      if (projetoId !== 'all' && material.projectId !== projetoId) return false
      if (responsavelId !== 'all' && !project?.memberIds.includes(responsavelId)) return false
      if (aprovadorId !== 'all' && !project?.approverIds.includes(aprovadorId)) return false
      if (statusFiltro !== 'all' && material.status !== statusFiltro) return false
      if (tipoFiltro !== 'all' && material.type !== tipoFiltro) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const hay = `${material.name} ${project?.name ?? ''} ${client?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    lista = [...lista].sort((a, b) => {
      const ca = contexto(a.projectId)
      const cb = contexto(b.projectId)
      if (ordenacao === 'recente')
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (ordenacao === 'antigo')
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      if (ordenacao === 'cliente')
        return (ca.client?.name ?? '').localeCompare(cb.client?.name ?? '', 'pt-BR')
      if (ordenacao === 'prazo') {
        const da = ca.project?.dueDate ? new Date(ca.project.dueDate).getTime() : Infinity
        const db = cb.project?.dueDate ? new Date(cb.project.dueDate).getTime() : Infinity
        return da - db
      }
      // urgente: atrasados, depois alterações, depois waiting, depois updatedAt
      const score = (m: Material) => {
        const { project } = contexto(m.projectId)
        if (atrasado(project)) return 0
        if (m.status === 'changes-requested') return 1
        if (m.status === 'waiting-approval') return 2
        if (m.status === 'in-review') return 3
        return 4
      }
      const diff = score(a) - score(b)
      if (diff !== 0) return diff
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
    return lista
  }, [
    materials,
    projects,
    clients,
    fila,
    busca,
    clienteId,
    projetoId,
    responsavelId,
    aprovadorId,
    statusFiltro,
    tipoFiltro,
    ordenacao,
    user?.id,
  ])

  const thumbnail = (material: Material) => {
    const versao = materialVersions.find((item) => item.id === material.currentVersionId)
    return versao?.imageUrl
  }

  return (
    <div>
      <PageHeader
        title="Revisões"
        description="Caixa de entrada do trabalho: o que precisa de ação agora."
      />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {filas.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFila(id)}
            className={`min-h-10 whitespace-nowrap rounded-full border px-3 text-sm ${
              fila === id
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-secondary'
            }`}
          >
            {label}
            <span className="ml-2 text-xs opacity-80">{contagens[id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_repeat(4,minmax(0,10rem))]">
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar material, projeto ou cliente" />
        <select
          aria-label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Projeto"
          value={projetoId}
          onChange={(e) => setProjetoId(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Responsável"
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Responsável</option>
          {team
            .filter((t) => t.status === 'active')
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Ordenação"
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="urgente">Mais urgente</option>
          <option value="prazo">Prazo</option>
          <option value="recente">Mais recente</option>
          <option value="antigo">Mais antigo</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <select
          aria-label="Aprovador"
          value={aprovadorId}
          onChange={(e) => setAprovadorId(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Aprovador</option>
          {team
            .filter((t) => t.status === 'active')
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Status"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as MaterialStatusType | 'all')}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Status</option>
          <option value="in-review">Em revisão</option>
          <option value="waiting-approval">Aguardando aprovação</option>
          <option value="changes-requested">Alterações solicitadas</option>
          <option value="approved">Aprovado</option>
          <option value="draft">Rascunho</option>
        </select>
        <select
          aria-label="Formato do material"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Formato</option>
          <option value="image">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <div className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {itens.map((material) => {
          const { project, client } = contexto(material.projectId)
          const thumb = thumbnail(material)
          const aguardando =
            material.status === 'waiting-approval'
              ? project?.approvers[0]
                ? `Aguardando aprovação de ${project.approvers[0]}`
                : 'Aguardando aprovação do cliente'
              : material.status === 'changes-requested'
                ? 'Cliente solicitou alterações'
                : null
          return (
            <div
              key={material.id}
              className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                atrasado(project) ? 'bg-revision/5' : ''
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-surface-secondary">
                  {thumb && material.type === 'image' ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-muted">
                      {materialTypeLabel(material.type)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{material.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {client?.name ?? 'Cliente'} · {project?.name ?? 'Projeto'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>v{material.currentVersion}</Badge>
                    <MaterialStatus status={material.status} />
                    <Badge tone={material.unresolvedCommentCount ? 'revision' : 'neutral'}>
                      {material.unresolvedCommentCount} comentários abertos
                    </Badge>
                    {atrasado(project) && <Badge tone="warning">Atrasado</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    {project?.members[0] ? `Responsável: ${project.members[0]}` : 'Sem responsável'}
                    {project?.approvers.length
                      ? ` · Aprovadores: ${project.approvers.join(', ')}`
                      : ''}
                    {project?.dueDate
                      ? ` · Prazo ${new Date(project.dueDate).toLocaleDateString('pt-BR')}`
                      : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {aguardando ? `${aguardando} · ` : ''}
                    {tempoRelativo(material.updatedAt)}
                  </p>
                </div>
              </div>
              <Link
                to={`/app/materiais/${material.id}/revisao`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-brand bg-brand px-4 text-sm font-semibold text-brand-contrast hover:bg-brand-hover"
              >
                Revisar
              </Link>
            </div>
          )
        })}
        {!itens.length && (
          <div className="p-6">
            <EmptyState
              title="Nada nesta fila"
              description="Quando houver materiais para revisar, solicitar alterações ou aprovar, eles aparecem aqui. Abra um projeto e adicione materiais para começar."
            />
            <div className="mt-4 flex justify-center">
              <Link
                to="/app/projetos"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand bg-brand px-4 text-sm font-semibold text-brand-contrast"
              >
                Ver projetos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
