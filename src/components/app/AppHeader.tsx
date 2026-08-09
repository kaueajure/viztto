import { Bell, ChevronDown, Menu, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { IconButton } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/DataDisplay'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'

const labels: Record<string, string> = {
  inicio: 'Início',
  clientes: 'Clientes',
  projetos: 'Projetos',
  materiais: 'Materiais',
  revisao: 'Revisão',
  revisoes: 'Revisões',
  equipe: 'Equipe',
  configuracoes: 'Configurações',
  novo: 'Novo',
}

export function AppHeader({
  openNavigation,
  trigger,
}: {
  openNavigation: () => void
  trigger: React.RefObject<HTMLButtonElement | null>
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { notifications, workspace } = useAppData()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const notificationsRoot = useRef<HTMLDivElement>(null)
  const userRoot = useRef<HTMLDivElement>(null)
  const notificationsTrigger = useRef<HTMLButtonElement>(null)
  const userTrigger = useRef<HTMLButtonElement>(null)
  const notificationsMenuId = useId()
  const userMenuId = useId()
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'inicio'

  useEffect(() => {
    if (!notificationsOpen && !userMenu) return
    const onPointerDown = (event: PointerEvent) => {
      const alvo = event.target as Node
      if (notificationsOpen && !notificationsRoot.current?.contains(alvo)) {
        setNotificationsOpen(false)
      }
      if (userMenu && !userRoot.current?.contains(alvo)) {
        setUserMenu(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (notificationsOpen) {
        setNotificationsOpen(false)
        notificationsTrigger.current?.focus()
      }
      if (userMenu) {
        setUserMenu(false)
        userTrigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [notificationsOpen, userMenu])

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <button
        ref={trigger}
        type="button"
        aria-label="Abrir navegação"
        aria-expanded={false}
        onClick={openNavigation}
        className="grid h-11 w-11 place-items-center rounded-md border border-line lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted">
          {workspace.name || 'Workspace'}
        </p>
        <p className="truncate text-sm font-semibold">{labels[segment] ?? 'Viztto'}</p>
      </div>
      <div className="ml-auto" />
      <IconButton label="Criar novo projeto" onClick={() => navigate('/app/projetos/novo')}>
        <Plus className="h-4 w-4" />
      </IconButton>
      <div className="relative" ref={notificationsRoot}>
        <IconButton
          ref={notificationsTrigger}
          label="Notificações"
          aria-haspopup="menu"
          aria-expanded={notificationsOpen}
          aria-controls={notificationsOpen ? notificationsMenuId : undefined}
          onClick={() => {
            setNotificationsOpen((aberto) => !aberto)
            setUserMenu(false)
          }}
        >
          <Bell className="h-4 w-4" />
        </IconButton>
        {notificationsOpen && (
          <div
            id={notificationsMenuId}
            role="menu"
            aria-label="Notificações"
            className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface-elevated p-2 shadow-raised"
          >
            <p className="px-3 py-2 text-sm font-semibold">Notificações</p>
            {notifications.map((item) => (
              <div
                role="menuitem"
                tabIndex={-1}
                className="rounded-md px-3 py-2 hover:bg-surface-secondary"
                key={item.id}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-secondary">{item.description}</p>
              </div>
            ))}
            {!notifications.length && (
              <p className="px-3 py-2 text-sm text-muted">Nenhuma notificação.</p>
            )}
          </div>
        )}
      </div>
      <div className="relative" ref={userRoot}>
        <button
          ref={userTrigger}
          type="button"
          aria-label="Abrir menu do usuário"
          aria-haspopup="menu"
          aria-expanded={userMenu}
          aria-controls={userMenu ? userMenuId : undefined}
          onClick={() => {
            setUserMenu((aberto) => !aberto)
            setNotificationsOpen(false)
          }}
          className="flex min-h-11 items-center gap-2 rounded-md px-1"
        >
          <Avatar name={user?.name || 'Usuário'} />
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
        {userMenu && (
          <div
            id={userMenuId}
            role="menu"
            aria-label="Menu do usuário"
            className="absolute right-0 top-12 w-48 rounded-md border border-line bg-surface-elevated p-1.5 shadow-raised"
          >
            <Link
              role="menuitem"
              to="/app/configuracoes"
              className="block rounded-sm px-3 py-2 text-sm hover:bg-surface-secondary"
              onClick={() => setUserMenu(false)}
            >
              Meu perfil
            </Link>
            <Link
              role="menuitem"
              to="/app/configuracoes"
              className="block rounded-sm px-3 py-2 text-sm hover:bg-surface-secondary"
              onClick={() => setUserMenu(false)}
            >
              Configurações
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={saindo}
              className="block w-full rounded-sm px-3 py-2 text-left text-sm text-revision hover:bg-revision-soft"
              onClick={() => {
                if (saindo) return
                setSaindo(true)
                setUserMenu(false)
                void logout().finally(() => window.location.replace('/entrar'))
              }}
            >
              {saindo ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
