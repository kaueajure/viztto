import {
  Archive,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  UserRound,
  Workflow,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button, IconButton } from '@/components/ui/Button'
import { useAppData } from '@/contexts/AppDataContext'
import { cn } from '@/lib/cn'

const links = [
  ['/app/inicio', 'Início', LayoutDashboard],
  ['/app/clientes', 'Clientes', UserRound],
  ['/app/projetos', 'Projetos', FolderKanban],
  ['/app/materiais', 'Materiais', Archive],
  ['/app/revisoes', 'Revisões', Workflow],
  ['/app/equipe', 'Equipe', Users],
  ['/app/configuracoes', 'Configurações', Settings],
] as const

function SidebarContent({ close }: { close?: () => void }) {
  const navigate = useNavigate()
  const { workspace } = useAppData()
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        <Logo compact />
        {close && (
          <IconButton label="Fechar navegação" onClick={close}>
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </div>
      <div className="p-3">
        <button className="flex w-full items-center justify-between rounded-md border border-line bg-surface-secondary px-3 py-3 text-left">
          <span>
            <span className="block text-[10px] uppercase tracking-wider text-muted">Workspace</span>
            <span className="mt-1 block text-sm font-semibold">{workspace.name}</span>
          </span>
          <span className="text-xs text-brand">Studio</span>
        </button>
        <Button
          className="mt-3 w-full"
          onClick={() => {
            navigate('/app/projetos/novo')
            close?.()
          }}
        >
          Novo projeto
        </Button>
      </div>
      <nav aria-label="Navegação do aplicativo" className="flex-1 space-y-1 px-3">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-secondary hover:bg-surface-secondary hover:text-ink',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-md border border-line bg-surface-secondary p-3">
        <p className="text-xs font-semibold">Plano Studio</p>
        <p className="mt-1 text-[11px] text-muted">25 projetos ativos · limites provisórios</p>
      </div>
    </div>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block">
      <SidebarContent />
    </aside>
  )
}

export function MobileAppNavigation({
  open,
  onClose,
  trigger,
}: {
  open: boolean
  onClose: () => void
  trigger: React.RefObject<HTMLButtonElement | null>
}) {
  const panel = useRef<HTMLElement>(null)
  const location = useLocation()
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    const triggerElement = trigger.current
    document.body.style.overflow = 'hidden'
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && panel.current) {
        const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>('a,button'))
        const first = nodes[0],
          last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', key)
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('a,button')?.focus())
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', key)
      triggerElement?.focus()
    }
  }, [open, onClose, trigger])
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-overlay lg:hidden"
      onPointerDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Navegação do aplicativo"
        className="h-full w-[min(19rem,88vw)] border-r border-line bg-surface shadow-raised"
      >
        <SidebarContent close={onClose} />
      </aside>
    </div>
  )
}
