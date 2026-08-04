import { Outlet } from 'react-router-dom'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
