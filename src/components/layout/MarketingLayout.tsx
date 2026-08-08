import { Outlet, useLocation } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HomeIntroProvider } from '@/sections/home/hero/homeIntroContext'

export function MarketingLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const reducedMotion = Boolean(useReducedMotion())
  const [homeIntroActive, setHomeIntroActive] = useState(() => isHome && !reducedMotion)

  useEffect(() => {
    setHomeIntroActive(isHome && !reducedMotion)
  }, [isHome, reducedMotion])

  const introValue = useMemo(
    () => ({ homeIntroActive, setHomeIntroActive }),
    [homeIntroActive],
  )

  const showChrome = !isHome || !homeIntroActive

  return (
    <HomeIntroProvider value={introValue}>
      <div className="min-h-screen bg-background">
        {showChrome ? <SiteHeader /> : null}
        <main className={homeIntroActive ? 'invisible' : undefined}>
          <Outlet />
        </main>
        {showChrome ? <SiteFooter /> : null}
      </div>
    </HomeIntroProvider>
  )
}
