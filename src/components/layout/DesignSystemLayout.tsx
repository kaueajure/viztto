import { Outlet } from 'react-router'

export function DesignSystemLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  )
}
