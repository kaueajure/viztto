import { Outlet } from 'react-router-dom'
import { AuthGuard, GuestGuard, OnboardingGuard } from '@/components/auth/AuthGuards'
import { AppShell } from '@/components/app/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { OnboardingLayout } from '@/components/layout/OnboardingLayout'
import { AppDataProvider } from '@/contexts/AppDataContext'
import { AuthProvider } from '@/contexts/AuthContext'

export function AuthAreaLayout() {
  return (
    <AuthProvider>
      <GuestGuard />
    </AuthProvider>
  )
}
export function AuthVisualLayout() {
  return <AuthLayout />
}
export function OnboardingAreaLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <OnboardingGuard />
      </AppDataProvider>
    </AuthProvider>
  )
}
export function OnboardingVisualLayout() {
  return <OnboardingLayout />
}
export function AppAreaLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AuthGuard />
      </AppDataProvider>
    </AuthProvider>
  )
}
export function AppVisualLayout() {
  return <AppShell />
}
export function ProductOutlet() {
  return <Outlet />
}
