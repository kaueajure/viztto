import {
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  MessageSquare,
  PenLine,
  Send,
  Upload,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { VizttoStatus } from '@/types/ui'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui/DataDisplay'

const statusMap: Record<VizttoStatus, { label: string; classes: string; icon: typeof Check }> = {
  approved: { label: 'Aprovado', classes: 'bg-approval-soft text-approval', icon: Check },
  waiting: { label: 'Aguardando aprovação', classes: 'bg-warning-soft text-warning', icon: Clock3 },
  changes: {
    label: 'Alterações solicitadas',
    classes: 'bg-revision-soft text-revision',
    icon: PenLine,
  },
  resolved: {
    label: 'Revisão concluída',
    classes: 'bg-accent-soft text-accent',
    icon: CheckCircle2,
  },
}

export function StatusBadge({ status }: { status: VizttoStatus }) {
  const item = statusMap[status]
  const Icon = item.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        item.classes,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  )
}
export function VersionBadge({
  children,
  approved = false,
  current = false,
}: {
  children: string
  approved?: boolean
  current?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-sm border px-2 py-1 text-xs font-semibold',
        approved
          ? 'border-approval bg-approval-soft text-approval'
          : current
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line bg-surface text-secondary',
      )}
    >
      {children}
    </span>
  )
}

type PinState = 'normal' | 'active' | 'resolved' | 'pending'
export function CommentPin({ number, state = 'normal' }: { number: number; state?: PinState }) {
  const styles = {
    normal: {
      button: 'bg-brand text-brand-contrast',
      pointer: 'bg-brand',
    },
    active: {
      button: 'bg-brand text-brand-contrast ring-4 ring-brand/25',
      pointer: 'bg-brand',
    },
    resolved: {
      button: 'bg-approval text-brand-contrast',
      pointer: 'bg-approval',
    },
    pending: {
      button: 'bg-revision text-background',
      pointer: 'bg-revision',
    },
  }
  return (
    <motion.button
      type="button"
      aria-label={`Comentário ${number}, ${state}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.93 }}
      className={cn(
        'relative grid h-8 w-8 place-items-center rounded-full text-xs font-bold shadow-soft',
        styles[state].button,
      )}
    >
      {number}
      <span className={cn('absolute -bottom-1 h-2.5 w-2.5 rotate-45', styles[state].pointer)} />
    </motion.button>
  )
}

export function CommentCard({ compact = false }: { compact?: boolean }) {
  return (
    <article
      className={cn(
        'rounded-lg border border-line bg-surface shadow-soft',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name="Marina Costa" color="bg-revision text-background" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Marina Costa</p>
            <span className="text-xs text-muted">há 12 min</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Podemos aumentar o respiro entre o título e a assinatura? A leitura fica mais clara
            nesta versão.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <VersionBadge>v3</VersionBadge>
            <StatusBadge status="changes" />
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex gap-2 border-t border-line pt-4">
          <button className="text-xs font-semibold text-brand">Responder</button>
          <span className="text-line-strong">·</span>
          <button className="text-xs font-semibold text-secondary">Resolver</button>
        </div>
      )}
    </article>
  )
}

export function ApprovalStamp({ status = 'approved' }: { status?: VizttoStatus }) {
  const approved = status === 'approved'
  return (
    <motion.div
      whileHover={{ rotate: -2, scale: 1.02 }}
      className={cn(
        'inline-flex rotate-[-3deg] items-center gap-2 rounded-sm border-2 px-4 py-2 text-sm font-bold uppercase tracking-[.1em]',
        approved ? 'border-approval text-approval' : 'border-revision text-revision',
      )}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-current">
        {approved ? <Check className="h-4 w-4" /> : <PenLine className="h-3.5 w-3.5" />}
      </span>
      {approved ? 'Aprovado' : 'Revisar'}
    </motion.div>
  )
}

export function CollaborativeCursor({
  name,
  color = 'brand',
  className,
}: {
  name: string
  color?: 'brand' | 'revision' | 'approval' | 'warning' | 'accent'
  className?: string
}) {
  const colors = {
    brand: { cursor: 'text-brand', label: 'bg-brand text-brand-contrast' },
    revision: { cursor: 'text-revision', label: 'bg-revision text-background' },
    approval: { cursor: 'text-approval', label: 'bg-approval text-brand-contrast' },
    warning: { cursor: 'text-warning', label: 'bg-warning text-brand-contrast' },
    accent: { cursor: 'text-accent', label: 'bg-accent text-background' },
  }
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      className={cn('inline-flex flex-col items-start', className)}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 28"
        className={cn('h-7 w-6 drop-shadow-sm', colors[color].cursor)}
      >
        <path
          fill="currentColor"
          d="M2 1.5v21.8l5.2-5.1 3.9 8.1 4.2-2-3.8-7.8h7.3L2 1.5Z"
          stroke="var(--surface)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          '-mt-1 ml-4 rounded-sm px-2 py-1 text-[10px] font-semibold shadow-soft',
          colors[color].label,
        )}
      >
        {name}
      </span>
    </motion.div>
  )
}

const history = [
  { icon: Upload, label: 'Material enviado', meta: 'Hoje, 09:14' },
  { icon: MessageSquare, label: 'Comentário adicionado', meta: 'Marina · 09:32' },
  { icon: Send, label: 'Nova versão publicada', meta: 'Versão 3 · 10:08' },
  { icon: CircleDot, label: 'Alteração solicitada', meta: 'Cliente · 10:21' },
  { icon: CheckCircle2, label: 'Versão aprovada', meta: 'Hoje, 11:46' },
]
export function HistoryLine() {
  return (
    <ol className="relative grid gap-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
      {history.map((item, i) => {
        const Icon = item.icon
        return (
          <li className="relative flex gap-3" key={item.label}>
            <span
              className={cn(
                'z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border',
                i === history.length - 1
                  ? 'border-approval bg-approval-soft text-approval'
                  : 'border-line bg-surface text-secondary',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted">{item.meta}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
