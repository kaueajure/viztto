import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DesignSystemLayout } from '@/components/layout/DesignSystemLayout'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { UtilityLayout } from '@/components/layout/UtilityLayout'
import { LoadingSkeleton } from '@/components/ui/DataDisplay'

const HomePage = lazy(() => import('@/pages/HomePage'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AuthAreaLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.AuthAreaLayout,
  })),
)
const AuthVisualLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.AuthVisualLayout,
  })),
)
const OnboardingAreaLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.OnboardingAreaLayout,
  })),
)
const OnboardingVisualLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.OnboardingVisualLayout,
  })),
)
const AppAreaLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.AppAreaLayout,
  })),
)
const AppVisualLayout = lazy(() =>
  import('@/components/layout/ProductAreaLayouts').then((module) => ({
    default: module.AppVisualLayout,
  })),
)
const LoginPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({ default: module.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })),
)
const VerifyEmailPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((module) => ({ default: module.VerifyEmailPage })),
)
const WorkspaceStep = lazy(() =>
  import('@/pages/onboarding/OnboardingPages').then((module) => ({
    default: module.WorkspaceStep,
  })),
)
const ProfileStep = lazy(() =>
  import('@/pages/onboarding/OnboardingPages').then((module) => ({ default: module.ProfileStep })),
)
const ClientStep = lazy(() =>
  import('@/pages/onboarding/OnboardingPages').then((module) => ({ default: module.ClientStep })),
)
const ProjectStep = lazy(() =>
  import('@/pages/onboarding/OnboardingPages').then((module) => ({ default: module.ProjectStep })),
)
const CompleteStep = lazy(() =>
  import('@/pages/onboarding/OnboardingPages').then((module) => ({ default: module.CompleteStep })),
)
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'))
const ClientsPage = lazy(() =>
  import('@/pages/app/ClientsPages').then((module) => ({ default: module.ClientsPage })),
)
const NewClientPage = lazy(() =>
  import('@/pages/app/ClientsPages').then((module) => ({ default: module.NewClientPage })),
)
const ClientDetailPage = lazy(() =>
  import('@/pages/app/ClientsPages').then((module) => ({ default: module.ClientDetailPage })),
)
const ProjectsPage = lazy(() =>
  import('@/pages/app/ProjectsPages').then((module) => ({ default: module.ProjectsPage })),
)
const NewProjectPage = lazy(() =>
  import('@/pages/app/ProjectsPages').then((module) => ({ default: module.NewProjectPage })),
)
const ProjectDetailPage = lazy(() =>
  import('@/pages/app/ProjectsPages').then((module) => ({ default: module.ProjectDetailPage })),
)
const MaterialsPage = lazy(() =>
  import('@/pages/app/MaterialsPages').then((module) => ({ default: module.MaterialsPage })),
)
const MaterialDetailPage = lazy(() =>
  import('@/pages/app/MaterialsPages').then((module) => ({ default: module.MaterialDetailPage })),
)
const ReviewsPage = lazy(() => import('@/pages/app/ReviewsPage'))
const TeamPage = lazy(() => import('@/pages/app/TeamPage'))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'))
const ReviewWorkspacePage = lazy(() => import('@/pages/app/ReviewWorkspacePage'))
const loading = (
  <div className="mx-auto max-w-page px-5 py-20">
    <LoadingSkeleton className="h-12 w-1/2" />
    <LoadingSkeleton className="mt-5 h-6 w-2/3" />
  </div>
)
const page = (node: React.ReactNode) => <Suspense fallback={loading}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: page(<HomePage />) },
      { path: '/produto', element: page(<PlaceholderPage />) },
      { path: '/recursos', element: page(<PlaceholderPage />) },
      { path: '/precos', element: page(<PlaceholderPage />) },
      { path: '/contato', element: page(<PlaceholderPage />) },
    ],
  },
  {
    element: page(<AuthAreaLayout />),
    children: [
      {
        element: page(<AuthVisualLayout />),
        children: [
          { path: '/entrar', element: page(<LoginPage />) },
          { path: '/criar-conta', element: page(<RegisterPage />) },
          { path: '/esqueci-senha', element: page(<ForgotPasswordPage />) },
          { path: '/verificar-email', element: page(<VerifyEmailPage />) },
        ],
      },
    ],
  },
  {
    element: page(<OnboardingAreaLayout />),
    children: [
      {
        element: page(<OnboardingVisualLayout />),
        children: [
          { path: '/onboarding', element: <Navigate to="/onboarding/workspace" replace /> },
          { path: '/onboarding/workspace', element: page(<WorkspaceStep />) },
          { path: '/onboarding/perfil', element: page(<ProfileStep />) },
          { path: '/onboarding/cliente', element: page(<ClientStep />) },
          { path: '/onboarding/projeto', element: page(<ProjectStep />) },
          { path: '/onboarding/concluido', element: page(<CompleteStep />) },
        ],
      },
    ],
  },
  {
    path: '/app',
    element: page(<AppAreaLayout />),
    children: [
      {
        element: page(<AppVisualLayout />),
        children: [
          { index: true, element: <Navigate to="/app/inicio" replace /> },
          { path: 'inicio', element: page(<DashboardPage />) },
          { path: 'clientes', element: page(<ClientsPage />) },
          { path: 'clientes/novo', element: page(<NewClientPage />) },
          { path: 'clientes/:clientId', element: page(<ClientDetailPage />) },
          { path: 'projetos', element: page(<ProjectsPage />) },
          { path: 'projetos/novo', element: page(<NewProjectPage />) },
          { path: 'projetos/:projectId', element: page(<ProjectDetailPage />) },
          { path: 'materiais', element: page(<MaterialsPage />) },
          { path: 'materiais/:materialId', element: page(<MaterialDetailPage />) },
          { path: 'materiais/:materialId/revisao', element: page(<ReviewWorkspacePage />) },
          { path: 'revisoes', element: page(<ReviewsPage />) },
          { path: 'equipe', element: page(<TeamPage />) },
          { path: 'configuracoes', element: page(<SettingsPage />) },
        ],
      },
    ],
  },
  {
    element: <UtilityLayout />,
    children: [
      { path: '/termos', element: page(<PlaceholderPage />) },
      { path: '/privacidade', element: page(<PlaceholderPage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
  {
    element: <DesignSystemLayout />,
    children: [{ path: '/design-system', element: page(<DesignSystemPage />) }],
  },
])
