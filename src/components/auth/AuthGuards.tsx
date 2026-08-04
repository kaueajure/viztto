import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export function AuthGuard() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading)
    return <div className="min-h-screen bg-background" aria-label="Carregando sessao" />
  if (!auth.user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (!auth.emailVerified) return <Navigate to="/verificar-email" replace />
  if (!auth.onboardingCompleted) return <Navigate to="/onboarding/workspace" replace />
  return <Outlet />
}

export function OnboardingGuard() {
  const auth = useAuth()
  if (auth.loading)
    return <div className="min-h-screen bg-background" aria-label="Carregando sessao" />
  if (!auth.user) return <Navigate to="/entrar" replace />
  if (!auth.emailVerified) return <Navigate to="/verificar-email" replace />
  if (auth.onboardingCompleted) return <Navigate to="/app/inicio" replace />
  return <Outlet />
}

export function GuestGuard() {
  const auth = useAuth()
  const path = useLocation().pathname
  if (auth.loading)
    return <div className="min-h-screen bg-background" aria-label="Carregando sessao" />
  if (!auth.user) return <Outlet />
  if (!auth.emailVerified) {
    return path === '/verificar-email' ? <Outlet /> : <Navigate to="/verificar-email" replace />
  }
  if (!auth.onboardingCompleted) return <Navigate to="/onboarding/workspace" replace />
  return <Navigate to="/app/inicio" replace />
}
