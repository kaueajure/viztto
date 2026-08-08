import { createContext, useContext, type ReactNode } from 'react'

type HomeIntroContextValue = {
  homeIntroActive: boolean
  setHomeIntroActive: (active: boolean) => void
}

const HomeIntroContext = createContext<HomeIntroContextValue | null>(null)

export function HomeIntroProvider({
  value,
  children,
}: {
  value: HomeIntroContextValue
  children: ReactNode
}) {
  return <HomeIntroContext.Provider value={value}>{children}</HomeIntroContext.Provider>
}

export function useHomeIntroOptional() {
  return useContext(HomeIntroContext)
}
