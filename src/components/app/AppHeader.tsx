import { Bell, ChevronDown, Menu, Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  const { notifications } = useAppData()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const search = useRef<HTMLInputElement>(null)
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'inicio'
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        search.current?.focus()
      }
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        setUserMenu(false)
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])
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
        <p className="text-[10px] uppercase tracking-wider text-muted">Estúdio Aurora</p>
        <p className="truncate text-sm font-semibold">{labels[segment] ?? 'Viztto'}</p>
      </div>
      <label className="relative ml-auto hidden w-full max-w-md md:block">
        <span className="sr-only">Buscar clientes, projetos ou materiais</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={search}
          placeholder="Buscar clientes, projetos ou materiais"
          className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-16 text-sm outline-none focus:border-brand"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
          Ctrl + K
        </span>
      </label>
      <IconButton label="Criar novo projeto" onClick={() => navigate('/app/projetos/novo')}>
        <Plus className="h-4 w-4" />
      </IconButton>
      <div className="relative">
        <IconButton
          label="Notificações"
          onClick={() => {
            setNotificationsOpen(!notificationsOpen)
            setUserMenu(false)
          }}
        >
          <Bell className="h-4 w-4" />
        </IconButton>
        {notificationsOpen && (
          <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface-elevated p-2 shadow-raised">
            <p className="px-3 py-2 text-sm font-semibold">Notificações</p>
            {notifications.map((item) => (
              <div className="rounded-md px-3 py-2 hover:bg-surface-secondary" key={item.id}>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          aria-expanded={userMenu}
          onClick={() => {
            setUserMenu(!userMenu)
            setNotificationsOpen(false)
          }}
          className="flex min-h-11 items-center gap-2 rounded-md px-1"
        >
          <Avatar name={user?.name ?? 'Marina Costa'} />
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
        {userMenu && (
          <div className="absolute right-0 top-12 w-48 rounded-md border border-line bg-surface-elevated p-1.5 shadow-raised">
            <Link
              to="/app/configuracoes"
              className="block rounded-sm px-3 py-2 text-sm hover:bg-surface-secondary"
            >
              Meu perfil
            </Link>
            <Link
              to="/app/configuracoes"
              className="block rounded-sm px-3 py-2 text-sm hover:bg-surface-secondary"
            >
              Configurações
            </Link>
            <button
              className="block w-full rounded-sm px-3 py-2 text-left text-sm text-revision hover:bg-revision-soft"
              onClick={() => {
                logout()
                navigate('/entrar')
              }}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
