import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { LoadingSkeleton } from '@/components/ui/DataDisplay'

const HomePage = lazy(() => import('@/pages/HomePage'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const loading = (
  <div className="mx-auto max-w-page px-5 py-20">
    <LoadingSkeleton className="h-12 w-1/2" />
    <LoadingSkeleton className="mt-5 h-6 w-2/3" />
  </div>
)
const page = (node: React.ReactNode) => <Suspense fallback={loading}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: page(<HomePage />) },
      { path: '/produto', element: page(<PlaceholderPage />) },
      { path: '/recursos', element: page(<PlaceholderPage />) },
      { path: '/precos', element: page(<PlaceholderPage />) },
      { path: '/entrar', element: page(<PlaceholderPage />) },
      { path: '/criar-conta', element: page(<PlaceholderPage />) },
      { path: '/design-system', element: page(<DesignSystemPage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
])
