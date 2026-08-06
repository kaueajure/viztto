import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'

function Header({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-secondary">{description}</p>
    </>
  )
}
const choices = (items: string[], active: string, select: (value: string) => void) => (
  <div className="mt-4 flex flex-wrap gap-2">
    {items.map((item) => (
      <button
        key={item}
        type="button"
        aria-pressed={active === item}
        onClick={() => select(item)}
        className={cn(
          'min-h-11 rounded-md border px-3 text-sm transition-colors',
          active === item
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface-secondary text-secondary hover:border-line-strong',
        )}
      >
        {item}
      </button>
    ))}
  </div>
)

export function WorkspaceStep() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding, updateWorkspace } = useAppData()
  const [name, setName] = useState(onboarding.workspaceName)
  const [slug, setSlug] = useState(onboarding.slug)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    updateOnboarding({ workspaceName: name, slug: finalSlug })
    updateWorkspace({ name, slug: finalSlug })
    navigate('/onboarding/perfil')
  }
  return (
    <form onSubmit={submit}>
      <Header
        title="Como devemos chamar seu espaço?"
        description="Esse nome identificará sua equipe, projetos e clientes."
      />
      <div className="mt-7 grid gap-4">
        <Input
          required
          label="Nome do workspace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do workspace"
        />
        <div className="flex flex-wrap gap-2">
          {['Meu workspace', 'Agência', 'Equipe de Marketing', 'Estúdio'].map(
            (item) => (
              <button
                className="rounded-full border border-line px-3 py-2 text-xs text-secondary hover:border-brand"
                type="button"
                onClick={() => setName(item)}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <Input
          label="URL curta (opcional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint={`viztto.site/${slug || 'sua-empresa'}`}
        />
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  )
}

export function ProfileStep() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useAppData()
  const [profile, setProfile] = useState(onboarding.profile)
  const [role, setRole] = useState(onboarding.role)
  return (
    <div>
      <Header
        title="Como você pretende usar o Viztto?"
        description="Isso ajuda a organizar seu espaço inicial."
      />
      <p className="mt-7 text-sm font-semibold">Perfil de uso</p>
      {choices(
        [
          'Freelancer',
          'Agência',
          'Estúdio criativo',
          'Equipe de marketing',
          'Desenvolvimento web',
          'Outro',
        ],
        profile,
        setProfile,
      )}
      <p className="mt-7 text-sm font-semibold">Qual é sua função?</p>
      {choices(
        ['Designer', 'Social media', 'Gestor', 'Vídeo', 'Desenvolvimento', 'Atendimento', 'Outra'],
        role,
        setRole,
      )}
      <Button
        className="mt-8"
        disabled={!profile || !role}
        onClick={() => {
          updateOnboarding({ profile, role })
          navigate('/onboarding/cliente')
        }}
      >
        Continuar
      </Button>
    </div>
  )
}

export function ClientStep() {
  const navigate = useNavigate()
  const { updateOnboarding } = useAppData()
  const [form, setForm] = useState({ name: '', email: '', company: '', notes: '' })
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name) return
    updateOnboarding({ clientDraft: form })
    navigate('/onboarding/projeto')
  }
  return (
    <form onSubmit={submit}>
      <Header
        title="Adicione seu primeiro cliente"
        description="Você poderá incluir mais contatos e aprovadores depois."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Input required label="Nome do cliente" value={form.name} onChange={set('name')} />
        <Input label="E-mail principal" type="email" value={form.email} onChange={set('email')} />
        <Input label="Empresa" value={form.company} onChange={set('company')} />
        <div className="sm:col-span-2">
          <Textarea label="Observação opcional" value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit">Adicionar e continuar</Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/onboarding/projeto')}>
          Fazer isso depois
        </Button>
      </div>
    </form>
  )
}

export function ProjectStep() {
  const navigate = useNavigate()
  const { clients, onboarding, updateOnboarding } = useAppData()
  const [form, setForm] = useState({
    name: '',
    clientId: clients[0]?.id ?? (onboarding.clientDraft ? 'cliente-pendente' : ''),
    type: 'Campanha',
    dueDate: '',
    description: '',
  })
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.clientId) return
    updateOnboarding({ projectDraft: { name: form.name, type: form.type, dueDate: form.dueDate, description: form.description } })
    navigate('/onboarding/concluido')
  }
  return (
    <form onSubmit={submit}>
      <Header
        title="Crie seu primeiro projeto"
        description="Comece com um fluxo simples; materiais serão adicionados dentro do projeto."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Input required label="Nome do projeto" value={form.name} onChange={set('name')} />
        <Select label="Cliente" value={form.clientId} onChange={set('clientId')}>
          <option value="">Selecione</option>
          {onboarding.clientDraft && (
            <option value="cliente-pendente">{onboarding.clientDraft.name}</option>
          )}
          {clients.map((client) => (
            <option value={client.id} key={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
        <Select label="Tipo de material" value={form.type} onChange={set('type')}>
          {['Redes sociais', 'Vídeo', 'Apresentação', 'Site', 'Campanha', 'Outro'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Input label="Data desejada" type="date" value={form.dueDate} onChange={set('dueDate')} />
        <div className="sm:col-span-2">
          <Textarea label="Descrição" value={form.description} onChange={set('description')} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit">Criar e continuar</Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/onboarding/concluido')}>
          Fazer isso depois
        </Button>
      </div>
    </form>
  )
}

export function CompleteStep() {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuth()
  const { onboarding, clients, projects, addClient, addProject } = useAppData()
  const client = clients.find((item) => item.id === onboarding.clientId)
  const project = projects.find((item) => item.id === onboarding.projectId)
  const [error, setError] = useState('')
  return (
    <div className="text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-approval-soft text-approval">
        <CheckCircle2 />
      </span>
      <Header
        title="Seu espaço está pronto"
        description="A base do seu fluxo já está organizada para começar."
      />
      <dl className="mx-auto mt-7 grid max-w-md gap-3 rounded-lg border border-line bg-surface-secondary p-5 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Workspace</dt>
          <dd className="font-semibold">{onboarding.workspaceName || 'Meu workspace'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Perfil</dt>
          <dd className="font-semibold">{onboarding.profile || 'Não informado'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Cliente</dt>
          <dd className="font-semibold">{client?.name || onboarding.clientDraft?.name || 'Será criado depois'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Projeto</dt>
          <dd className="font-semibold">{project?.name || onboarding.projectDraft?.name || 'Será criado depois'}</dd>
        </div>
      </dl>
      <Button
        className="mt-7"
        onClick={async () => {
          try {
            await completeOnboarding(
              onboarding.workspaceName || 'Meu workspace',
              onboarding.slug || 'meu-workspace',
            )
            let clientId: string | undefined
            if (onboarding.clientDraft) clientId = (await addClient(onboarding.clientDraft)).id
            if (onboarding.projectDraft && clientId) await addProject({ ...onboarding.projectDraft, clientId })
            navigate('/app/inicio')
          } catch (erro) {
            setError(erro instanceof Error ? erro.message : 'Nao foi possivel concluir.')
          }
        }}
      >
        Acessar o Viztto
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-revision">
          {error}
        </p>
      )}
    </div>
  )
}
