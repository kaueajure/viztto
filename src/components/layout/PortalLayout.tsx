import { Outlet } from 'react-router'

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <Outlet />
    </div>
  )
}
