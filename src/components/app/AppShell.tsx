import { useCallback, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app/AppHeader'
import { DesktopSidebar, MobileAppNavigation } from '@/components/app/AppSidebar'
import { useAuth } from '@/contexts/AuthContext'

export function AppShell() {
  const { isAuthenticated } = useAuth()
  const [navigation, setNavigation] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeNavigation = useCallback(() => setNavigation(false), [])
  if (!isAuthenticated) return <Navigate to="/entrar" replace />
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-brand focus:px-4 focus:py-3 focus:text-brand-contrast"
      >
        Pular para o conteúdo
      </a>
      <DesktopSidebar />
      <MobileAppNavigation open={navigation} onClose={closeNavigation} trigger={trigger} />
      <div className="lg:pl-60">
        <AppHeader openNavigation={() => setNavigation(true)} trigger={trigger} />
        <main id="app-content" className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
