import { Outlet } from 'react-router-dom'
import { AppShell } from '@/components/app/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { OnboardingLayout } from '@/components/layout/OnboardingLayout'
import { AppDataProvider } from '@/contexts/AppDataContext'
import { AuthProvider } from '@/contexts/AuthContext'

export function AuthAreaLayout() {
  return (
    <AuthProvider>
      <AuthLayout />
    </AuthProvider>
  )
}
export function OnboardingAreaLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <OnboardingLayout />
      </AppDataProvider>
    </AuthProvider>
  )
}
export function AppAreaLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </AuthProvider>
  )
}
export function ProductOutlet() {
  return <Outlet />
}
