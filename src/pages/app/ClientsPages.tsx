import { Grid2X2, List, MoreHorizontal, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader, ProjectStatusBadge, SearchField } from '@/components/app/AppUi'
import { Button, IconButton } from '@/components/ui/Button'
import { Avatar, EmptyState } from '@/components/ui/DataDisplay'
import { Input, Textarea } from '@/components/ui/FormControls'
import { useAppData } from '@/contexts/AppDataContext'

export function ClientsPage() {
  const { clients } = useAppData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('active')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sort, setSort] = useState('recent')
  const filtered = clients
    .filter(
      (client) =>
        (status === 'all' || client.status === status) &&
        `${client.name} ${client.company}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt),
    )
  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Clientes do workspace"
        action={{ label: 'Novo cliente', to: '/app/clientes/novo' }}
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar clientes" />
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="active">Ativos</option>
          <option value="archived">Arquivados</option>
          <option value="all">Todos</option>
        </select>
        <select
          aria-label="Ordenar clientes"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="name">Nome</option>
        </select>
        <div className="flex rounded-md border border-line bg-surface p-1">
          <IconButton
            label="Visualização em lista"
            onClick={() => setView('list')}
            className={view === 'list' ? 'bg-brand-soft text-brand' : ''}
          >
            <List className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Visualização em grade"
            onClick={() => setView('grid')}
            className={view === 'grid' ? 'bg-brand-soft text-brand' : ''}
          >
            <Grid2X2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      {!filtered.length ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou adicione um novo cliente."
            icon={UserRound}
          />
        </div>
      ) : view === 'grid' ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <Link
              to={`/app/clientes/${client.id}`}
              key={client.id}
              className="rounded-lg border border-line bg-surface p-5 transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between">
                <Avatar name={client.name} color="bg-brand-soft text-brand" />
                <MoreHorizontal className="h-4 w-4 text-muted" />
              </div>
              <h2 className="mt-5 font-semibold">{client.name}</h2>
              <p className="mt-1 text-sm text-secondary">{client.company}</p>
              <div className="mt-5 flex gap-5 border-t border-line pt-4 text-xs">
                <span>
                  <strong className="block text-base text-ink">{client.projectCount}</strong>{' '}
                  projetos
                </span>
                <span>
                  <strong className="block text-base text-warning">
                    {client.pendingApprovals}
                  </strong>{' '}
                  pendências
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="hidden border-b border-line bg-surface-secondary text-xs text-muted md:table-header-group">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Projetos</th>
                <th className="p-4">Pendências</th>
                <th className="p-4">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="block p-4 hover:bg-surface-secondary md:table-row md:p-0"
                >
                  <td className="block md:table-cell md:p-4">
                    <Link
                      className="font-semibold hover:text-brand"
                      to={`/app/clientes/${client.id}`}
                    >
                      {client.name}
                    </Link>
                    <span className="mt-1 block text-xs text-muted">{client.company}</span>
                  </td>
                  <td className="mt-2 block text-secondary md:mt-0 md:table-cell md:p-4">
                    {client.email}
                  </td>
                  <td className="mt-2 inline-block md:table-cell md:p-4">{client.projectCount}</td>
                  <td className="mt-2 ml-5 inline-block md:ml-0 md:table-cell md:p-4">
                    {client.pendingApprovals}
                  </td>
                  <td className="mt-2 block text-muted md:mt-0 md:table-cell md:p-4">
                    {new Date(client.updatedAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function NewClientPage() {
  const navigate = useNavigate()
  const { addClient } = useAppData()
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
    color: '#b8ff4f',
  })
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setErro('')
    try {
      const client = await addClient(form)
      setSaved(true)
      window.setTimeout(() => navigate(`/app/clientes/${client.id}`), 350)
    } catch (falha) {
      setSaved(false)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o cliente.')
    }
  }
  return (
    <ClientForm
      title="Novo cliente"
      description="Novo cliente"
      form={form}
      set={set}
      saved={saved}
      erro={erro}
      submitLabel="Salvar cliente"
      onSubmit={submit}
      onCancel={() => navigate('/app/clientes')}
    />
  )
}

export function EditClientPage() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { clients, updateClient } = useAppData()
  const client = clients.find((item) => item.id === clientId)
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    name: client?.name ?? '',
    company: client?.company ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    notes: client?.notes ?? '',
    color: client?.color ?? '#b8ff4f',
  })
  if (!client)
    return (
      <EmptyState
        title="Cliente não encontrado"
        description="Este registro não está disponível no workspace atual."
      />
    )
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setErro('')
    try {
      await updateClient(client.id, form)
      setSaved(true)
      window.setTimeout(() => navigate(`/app/clientes/${client.id}`), 350)
    } catch (falha) {
      setSaved(false)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível atualizar o cliente.')
    }
  }
  return (
    <ClientForm
      title="Editar cliente"
      description={client.company || 'Atualize os dados do cliente'}
      form={form}
      set={set}
      saved={saved}
      erro={erro}
      submitLabel="Salvar alterações"
      onSubmit={submit}
      onCancel={() => navigate(`/app/clientes/${client.id}`)}
    />
  )
}

function ClientForm({
  title,
  description,
  form,
  set,
  saved,
  erro,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string
  description: string
  form: {
    name: string
    company: string
    email: string
    phone: string
    notes: string
    color: string
  }
  set: (
    key: keyof typeof form,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  saved: boolean
  erro: string
  submitLabel: string
  onSubmit: (event: FormEvent) => Promise<void>
  onCancel: () => void
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <form
        onSubmit={onSubmit}
        className="mt-7 max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input required label="Nome" value={form.name} onChange={set('name')} />
          <Input label="Empresa" value={form.company} onChange={set('company')} />
          <Input label="E-mail" type="email" value={form.email} onChange={set('email')} />
          <Input label="Telefone opcional" value={form.phone} onChange={set('phone')} />
          <Input
            label="Cor de identificação"
            type="color"
            value={form.color}
            onChange={set('color')}
            className="h-11 p-1"
          />
          <div className="sm:col-span-2">
            <Textarea label="Observações" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        {saved && (
          <p role="status" className="mt-4 text-sm text-approval">
            Cliente salvo.
          </p>
        )}
        {erro && (
          <p role="alert" className="mt-4 text-sm text-revision">
            {erro}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { clients, projects, archiveClient } = useAppData()
  const [acaoMsg, setAcaoMsg] = useState('')
  const [acaoErro, setAcaoErro] = useState('')
  const [arquivando, setArquivando] = useState(false)
  const client = clients.find((item) => item.id === clientId)
  if (!client)
    return (
      <EmptyState
        title="Cliente não encontrado"
        description="Este registro não está disponível no workspace atual."
      />
    )
  const related = projects.filter((item) => item.clientId === client.id)
  const alternarArquivo = async () => {
    setAcaoMsg('')
    setAcaoErro('')
    setArquivando(true)
    try {
      const arquivar = client.status === 'active'
      await archiveClient(client.id, arquivar)
      setAcaoMsg(arquivar ? 'Cliente arquivado.' : 'Cliente restaurado.')
    } catch (falha) {
      setAcaoErro(falha instanceof Error ? falha.message : 'Não foi possível atualizar o status.')
    } finally {
      setArquivando(false)
    }
  }
  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company || 'Cliente do workspace'}
        action={{ label: 'Novo projeto', to: `/app/projetos/novo?client=${client.id}` }}
      >
        <p className="mt-3 text-sm text-secondary">
          {client.email} {client.phone ? `· ${client.phone}` : ''}
        </p>
      </PageHeader>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line p-5 font-semibold">Projetos</h2>
          <div className="divide-y divide-line">
            {related.map((project) => (
              <Link
                className="flex items-center justify-between gap-4 p-4 hover:bg-surface-secondary"
                to={`/app/projetos/${project.id}`}
                key={project.id}
              >
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {project.materialCount} materiais · {project.commentCount} comentários
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </Link>
            ))}
            {!related.length && (
              <p className="p-5 text-sm text-muted">Nenhum projeto criado para este cliente.</p>
            )}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Resumo</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Projetos</dt>
                <dd>{client.projectCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Aprovações pendentes</dt>
                <dd className="text-warning">{client.pendingApprovals}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd>{client.status === 'active' ? 'Ativo' : 'Arquivado'}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Ações</h2>
            <button
              type="button"
              className="mt-4 block text-sm text-secondary hover:text-ink"
              onClick={() => navigate(`/app/clientes/${client.id}/editar`)}
            >
              Editar cliente
            </button>
            <button
              type="button"
              className="mt-3 block text-sm text-warning disabled:opacity-60"
              disabled={arquivando}
              onClick={() => void alternarArquivo()}
            >
              {client.status === 'active' ? 'Arquivar cliente' : 'Restaurar cliente'}
            </button>
            {acaoMsg && (
              <p role="status" className="mt-3 text-sm text-approval">
                {acaoMsg}
              </p>
            )}
            {acaoErro && (
              <p role="alert" className="mt-3 text-sm text-revision">
                {acaoErro}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
