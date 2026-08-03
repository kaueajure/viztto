import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const links = [
  ['Produto', '/produto'],
  ['Recursos', '/recursos'],
  ['Preços', '/precos'],
  ['Design system', '/design-system'],
]

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute inset-x-4 top-[72px] z-40 rounded-lg border border-line bg-surface-elevated p-3 shadow-raised md:hidden"
        >
          <nav className="grid">
            {links.map(([label, path]) => (
              <NavLink
                onClick={onClose}
                key={path}
                to={path}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-surface-secondary"
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
            <LinkButton to="/entrar" variant="outline">
              Entrar
            </LinkButton>
            <LinkButton to="/criar-conta">Criar conta</LinkButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="relative z-30 border-b border-line/80 bg-background/95">
      <Container className="flex h-[72px] items-center justify-between">
        <Link to="/" aria-label="Viztto — página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary',
                  isActive && 'text-brand',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LinkButton to="/entrar" variant="ghost">
            Entrar
          </LinkButton>
          <LinkButton to="/criar-conta">Criar conta</LinkButton>
        </div>
        <button
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface md:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </Container>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  )
}
