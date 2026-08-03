import { Inbox, type LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-surface p-5 shadow-soft', className)}
      {...props}
    />
  )
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'approval' | 'revision' | 'warning'
}) {
  const tones = {
    neutral: 'bg-surface-secondary text-secondary',
    brand: 'bg-brand-soft text-brand-hover',
    approval: 'bg-approval-soft text-approval-dark',
    revision: 'bg-revision-soft text-revision-dark',
    warning: 'bg-warning-soft text-ink',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-line" />
      {label && <span className="text-xs text-muted">{label}</span>}
      {label && <span className="h-px flex-1 bg-line" />}
    </div>
  )
}
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="Carregando"
      className={cn('h-4 animate-pulse rounded bg-surface-secondary', className)}
    />
  )
}
export function EmptyState({
  title = 'Nada por aqui',
  description = 'Os materiais aparecerão aqui quando forem enviados.',
  icon: Icon = Inbox,
}: {
  title?: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line-strong bg-surface p-8 text-center">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-secondary">{description}</p>
    </div>
  )
}
export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav aria-label="Navegação estrutural">
      <ol className="flex flex-wrap gap-2 text-sm text-secondary">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className={i === items.length - 1 ? 'font-medium text-ink' : ''}>{item}</span>
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
export function Avatar({ name, color = 'bg-brand' }: { name: string; color?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      title={name}
      className={cn(
        'inline-grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-surface text-xs font-semibold text-white',
        color,
      )}
    >
      {initials}
    </span>
  )
}
export function AvatarGroup({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.map((n, i) => (
        <Avatar
          key={n}
          name={n}
          color={['bg-brand', 'bg-revision', 'bg-approval-dark', 'bg-warning'][i % 4]}
        />
      ))}
    </div>
  )
}
