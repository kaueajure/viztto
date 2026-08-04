import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/layout/Container'

export function UtilityLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-line-subtle py-4">
        <Container className="flex items-center justify-between gap-5">
          <Link to="/" aria-label="Viztto — página inicial">
            <Logo compact />
          </Link>
          <Link to="/" className="text-sm font-semibold text-secondary hover:text-brand">
            Página inicial
          </Link>
        </Container>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line-subtle py-5 text-center text-xs text-muted">
        © 2026 Viztto. Todos os direitos reservados.
      </footer>
    </div>
  )
}
