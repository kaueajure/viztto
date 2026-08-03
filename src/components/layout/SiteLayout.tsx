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
        <div className="mx-auto max-w-page px-5 text-center text-xs text-muted sm:px-7 lg:px-10">
          <span>Viztto · revisão criativa no lugar certo</span>
        </div>
      </footer>
    </div>
  )
}
