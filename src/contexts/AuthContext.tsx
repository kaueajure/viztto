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

type AuthValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  pendingEmail: string
  login: (email: string) => void
  logout: () => void
  register: (name: string, email: string) => void
}

const AuthContext = createContext<AuthValue | null>(null)
type StoredAuth = { user: AuthUser | null; pendingEmail: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(() =>
    localStorageService.get<StoredAuth>(storageKeys.auth, {
      user: null,
      pendingEmail: '',
    }),
  )
  const persist = (next: StoredAuth) => {
    setAuth(next)
    localStorageService.set(storageKeys.auth, next)
  }
  const value = useMemo<AuthValue>(
    () => ({
      user: auth.user,
      pendingEmail: auth.pendingEmail,
      isAuthenticated: Boolean(auth.user),
      login(email) {
        persist({ user: { ...demoUser, email }, pendingEmail: email })
      },
      logout() {
        persist({ user: null, pendingEmail: '' })
      },
      register(name, email) {
        persist({
          user: { id: `user-${Date.now()}`, name, email, role: 'Administrador' },
          pendingEmail: email,
        })
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
