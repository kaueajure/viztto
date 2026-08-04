import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { demoUser } from '@/data/mock/users'
import { localStorageService, storageKeys } from '@/services/localStorageService'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export type AuthState = {
  user: AuthUser | null
  pendingEmail: string
  emailVerified: boolean
  onboardingCompleted: boolean
}

type AuthValue = AuthState & {
  isAuthenticated: boolean
  login: (email: string) => void
  register: (name: string, email: string) => void
  verifyEmail: () => void
  completeOnboarding: () => void
  logout: () => void
  resetAuth: () => void
}

const emptyAuth: AuthState = {
  user: null,
  pendingEmail: '',
  emailVerified: false,
  onboardingCompleted: false,
}

function migrateAuth(stored: Partial<AuthState> & { user?: AuthUser | null }): AuthState {
  if (!stored.user) return { ...emptyAuth, pendingEmail: stored.pendingEmail ?? '' }
  const legacySession = stored.emailVerified === undefined
  return {
    user: stored.user,
    pendingEmail: stored.pendingEmail ?? stored.user.email,
    emailVerified: legacySession ? true : Boolean(stored.emailVerified),
    onboardingCompleted: legacySession ? true : Boolean(stored.onboardingCompleted),
  }
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() =>
    migrateAuth(localStorageService.get<Partial<AuthState>>(storageKeys.auth, emptyAuth)),
  )
  const persist = (next: AuthState) => {
    setAuth(next)
    localStorageService.set(storageKeys.auth, next)
  }
  const value = useMemo<AuthValue>(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.user && auth.emailVerified && auth.onboardingCompleted),
      login(email) {
        persist({
          user: { ...demoUser, email },
          pendingEmail: email,
          emailVerified: true,
          onboardingCompleted: true,
        })
      },
      register(name, email) {
        persist({
          user: { id: `user-${Date.now()}`, name, email, role: 'Administrador' },
          pendingEmail: email,
          emailVerified: false,
          onboardingCompleted: false,
        })
      },
      verifyEmail() {
        persist({ ...auth, emailVerified: true })
      },
      completeOnboarding() {
        persist({ ...auth, emailVerified: true, onboardingCompleted: true })
      },
      logout() {
        persist(emptyAuth)
      },
      resetAuth() {
        persist(emptyAuth)
      },
    }),
    [auth],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return value
}
