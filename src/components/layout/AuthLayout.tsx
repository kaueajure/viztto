import { Link, Outlet } from 'react-router'
import { Logo } from '@/components/brand/Logo'

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <header className="relative border-b border-line-subtle px-5 py-5">
        <div className="mx-auto flex max-w-page items-center justify-between">
          <Link to="/" aria-label="Viztto — página inicial">
            <Logo compact />
          </Link>
          <Link to="/" className="text-sm font-semibold text-secondary hover:text-brand">
            Voltar ao site
          </Link>
        </div>
      </header>
      <main className="relative">
        <Outlet />
      </main>
    </div>
  )
}
