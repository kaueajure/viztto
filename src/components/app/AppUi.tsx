import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Badge, Progress } from '@/components/ui/DataDisplay'
import type { Material, ProjectStatus } from '@/types/domain'

export function PageHeader({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: { label: string; to: string }
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-secondary">{description}</p> : null}
        {children}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand bg-brand px-4 text-sm font-semibold text-brand-contrast hover:bg-brand-hover"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config: Record<
    ProjectStatus,
    [string, 'neutral' | 'brand' | 'approval' | 'revision' | 'warning']
  > = {
    draft: ['Rascunho', 'neutral'],
    'in-progress': ['Em andamento', 'brand'],
    'in-review': ['Aguardando revisão', 'brand'],
    'changes-requested': ['Alterações solicitadas', 'revision'],
    'waiting-approval': ['Aguardando cliente', 'warning'],
    approved: ['Concluído', 'approval'],
    archived: ['Arquivado', 'neutral'],
  }
  const [label, tone] = config[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function MaterialStatus({ status }: { status: Material['status'] }) {
  const config = {
    draft: ['Rascunho', 'neutral'],
    'in-review': ['Aguardando revisão', 'brand'],
    'waiting-approval': ['Aguardando envio interno', 'warning'],
    'changes-requested': ['Alterações solicitadas', 'revision'],
    approved: ['Aprovado', 'approval'],
  } as const
  const [label, tone] = config[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function ProjectProgress({
  value,
  approved,
  total,
}: {
  value: number
  approved?: number
  total?: number
}) {
  const temContagem = typeof approved === 'number' && typeof total === 'number'
  return (
    <div className={temContagem ? 'min-w-[8.5rem]' : 'w-28'}>
      {temContagem && (
        <p className="mb-1 text-xs text-secondary">
          {approved} de {total} aprovados · {value}%
        </p>
      )}
      <Progress value={value} />
    </div>
  )
}
