import { ArrowLeft, LogOut } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Progress } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'

const steps = ['workspace', 'perfil', 'cliente', 'projeto', 'concluido']

export function OnboardingLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { onboarding } = useAppData()
  const current = Math.max(
    0,
    steps.findIndex((step) => pathname.endsWith(step)),
  )
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-surface/70 px-5 py-4">
        <div className="mx-auto flex max-w-page items-center justify-between">
          <Link to="/">
            <Logo compact />
          </Link>
          <Link
            to="/entrar"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary hover:text-brand"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-page gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main id="onboarding-content" className="mx-auto w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-5">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <span className="text-sm text-muted">Etapa {current + 1} de 5</span>
          </div>
          <Progress value={(current + 1) * 20} label="Progresso do seu espaço" />
          <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-8">
            <Outlet />
          </div>
        </main>
        <aside className="hidden h-fit rounded-lg border border-line bg-surface-secondary p-5 lg:block">
          <p className="eyebrow">Seu espaço</p>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-muted">Workspace</dt>
              <dd className="mt-1 font-semibold">
                {onboarding.workspaceName || 'Ainda não definido'}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Perfil</dt>
              <dd className="mt-1 font-semibold">{onboarding.profile || 'Ainda não definido'}</dd>
            </div>
            <div>
              <dt className="text-muted">Função</dt>
              <dd className="mt-1 font-semibold">{onboarding.role || 'Ainda não definida'}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
