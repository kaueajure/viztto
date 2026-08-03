import { Outlet } from 'react-router-dom'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-line py-7">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-7 lg:px-10">
          <span>viztto — revisão criativa no lugar certo.</span>
          <span>Fundação visual · etapa 01</span>
        </div>
      </footer>
    </div>
  )
}
