import {
  Archive,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  UserRound,
  Workflow,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button, IconButton } from '@/components/ui/Button'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { autenticacaoApi } from '@/services/api/autenticacaoApi'
import { assinaturasApi, type UsoLimitesPlano } from '@/services/api/assinaturasApi'
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

type WorkspaceOpcao = { id: string; nome: string; slug: string; plano: string }

function WorkspaceSwitcher({ close }: { close?: () => void }) {
  const { workspace, refresh } = useAppData()
  const { user, switchWorkspace } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [opcoes, setOpcoes] = useState<WorkspaceOpcao[]>([])
  const [trocando, setTrocando] = useState(false)
  const painel = useRef<HTMLDivElement>(null)
  const podeTrocar = Boolean(user?.admin || opcoes.length > 1)

  useEffect(() => {
    let ativo = true
    autenticacaoApi
      .listarWorkspaces()
      .then(({ dados }) => {
        if (ativo) setOpcoes(dados)
      })
      .catch(() => {
        if (ativo) setOpcoes([])
      })
    return () => {
      ativo = false
    }
  }, [user?.workspaceId, user?.admin])

  useEffect(() => {
    if (!aberto) return
    const fechar = (event: MouseEvent) => {
      if (!painel.current?.contains(event.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  async function selecionar(workspaceId: string) {
    if (workspaceId === workspace.id || trocando) return
    setTrocando(true)
    try {
      await switchWorkspace(workspaceId)
      await refresh()
      setAberto(false)
      close?.()
    } finally {
      setTrocando(false)
    }
  }

  return (
    <div ref={painel} className="relative">
      <button
        type="button"
        disabled={!podeTrocar || trocando}
        onClick={() => podeTrocar && setAberto((valor) => !valor)}
        className="flex w-full items-center justify-between rounded-md border border-line bg-surface-secondary px-3 py-3 text-left disabled:opacity-100"
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span>
          <span className="block text-[10px] uppercase tracking-wider text-muted">
            {user?.admin ? 'Visão da empresa' : 'Workspace'}
          </span>
          <span className="mt-1 block text-sm font-semibold">{workspace.name}</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-brand">
          {user?.admin ? 'Admin' : workspace.plan}
          {podeTrocar && <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {aberto && (
        <ul
          role="listbox"
          className="absolute inset-x-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-surface py-1 shadow-raised"
        >
          {opcoes.map((opcao) => (
            <li key={opcao.id}>
              <button
                type="button"
                role="option"
                aria-selected={opcao.id === workspace.id}
                disabled={trocando}
                onClick={() => void selecionar(opcao.id)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-secondary',
                  opcao.id === workspace.id && 'bg-brand-soft text-brand',
                )}
              >
                <span>
                  <span className="block font-medium">{opcao.nome}</span>
                  <span className="block text-[11px] text-muted">{opcao.slug}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatarLimite(uso: number, max: number | null) {
  if (max == null) return `${uso} · ilimitado`
  return `${uso} / ${max}`
}

function SidebarContent({ close }: { close?: () => void }) {
  const navigate = useNavigate()
  const { workspace } = useAppData()
  const [limites, setLimites] = useState<UsoLimitesPlano | null>(null)
  const [limitesProntos, setLimitesProntos] = useState(false)

  useEffect(() => {
    let ativo = true
    setLimitesProntos(false)
    void assinaturasApi
      .limites()
      .then(({ dado }) => {
        if (!ativo) return
        setLimites(dado)
        setLimitesProntos(true)
      })
      .catch(() => {
        if (!ativo) return
        setLimites(null)
        setLimitesProntos(true)
      })
    return () => {
      ativo = false
    }
  }, [workspace.id, workspace.plan])

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
        <WorkspaceSwitcher close={close} />
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
        <p className="text-xs font-semibold">
          Plano {limites?.nome ?? workspace.plan ?? 'gratuito'}
        </p>
        {limites ? (
          <ul className="mt-2 space-y-1 text-[11px] text-muted">
            <li>
              Projetos {formatarLimite(limites.uso.projetosAtivos, limites.limites.maxProjetosAtivos)}
            </li>
            <li>Membros {formatarLimite(limites.uso.membros, limites.limites.maxMembros)}</li>
            <li>Clientes {formatarLimite(limites.uso.clientes, limites.limites.maxClientes)}</li>
            <li>
              Armazenamento{' '}
              {limites.limites.maxArmazenamentoGb == null
                ? `${limites.uso.armazenamentoGb} GB`
                : `${limites.uso.armazenamentoGb} / ${limites.limites.maxArmazenamentoGb} GB`}
            </li>
          </ul>
        ) : (
          <p className="mt-1 text-[11px] text-muted">
            {limitesProntos ? 'Limites indisponíveis.' : 'Carregando limites…'}
          </p>
        )}
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
