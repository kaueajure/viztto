import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { autenticacaoApi } from '@/services/api/autenticacaoApi'
import { ApiError } from '@/services/api/clienteHttp'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  admin: boolean
  workspaceId: string
}
export type AuthState = {
  user: AuthUser | null
  pendingEmail: string
  emailVerified: boolean
  onboardingCompleted: boolean
}
type AuthValue = AuthState & {
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (name: string, email: string, senha: string) => Promise<void>
  verifyEmail: (token?: string) => Promise<void>
  resendVerification: () => Promise<void>
  completeOnboarding: (nome: string, slug: string) => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  logout: () => Promise<void>
  resetAuth: () => Promise<void>
}
const vazio: AuthState = {
  user: null,
  pendingEmail: '',
  emailVerified: false,
  onboardingCompleted: false,
}
const AuthContext = createContext<AuthValue | null>(null)

function usuarioDaSessao(sessao: {
  usuarioId: string
  usuarioNome: string
  usuarioEmail: string
  workspaceId: string
  funcao: string
  admin: boolean
}): AuthUser {
  return {
    id: sessao.usuarioId,
    name: sessao.usuarioNome,
    email: sessao.usuarioEmail,
    role: sessao.funcao,
    admin: sessao.admin,
    workspaceId: sessao.workspaceId,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(vazio)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let ativo = true
    autenticacaoApi
      .sessao()
      .then(({ sessao }) => {
        if (ativo)
          setAuth({
            user: usuarioDaSessao(sessao),
            pendingEmail: sessao.usuarioEmail,
            emailVerified: true,
            onboardingCompleted: true,
          })
      })
      .catch((erro) => {
        if (!ativo) return
        if (!(erro instanceof ApiError) || erro.status !== 401) console.error(erro)
        const usuarioId = sessionStorage.getItem('viztto_usuario_pendente')
        const cadastro = sessionStorage.getItem('viztto_cadastro_pendente')
        if (usuarioId && cadastro) {
          const pendente = JSON.parse(cadastro) as { name: string; email: string }
          setAuth({
            user: {
              id: usuarioId,
              name: pendente.name,
              email: pendente.email,
              role: 'administrador',
              admin: false,
              workspaceId: '',
            },
            pendingEmail: pendente.email,
            emailVerified: true,
            onboardingCompleted: false,
          })
        }
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [])
  const value = useMemo<AuthValue>(
    () => ({
      ...auth,
      loading,
      isAuthenticated: Boolean(auth.user && auth.emailVerified && auth.onboardingCompleted),
      async login(email, senha) {
        await autenticacaoApi.entrar(email, senha)
        const { sessao } = await autenticacaoApi.sessao()
        setAuth({
          user: usuarioDaSessao(sessao),
          pendingEmail: sessao.usuarioEmail,
          emailVerified: true,
          onboardingCompleted: true,
        })
      },
      async register(name, email, senha) {
        const r = await autenticacaoApi.cadastrar(name, email, senha)
        if (r.tokenVerificacao)
          sessionStorage.setItem('viztto_token_verificacao', r.tokenVerificacao)
        sessionStorage.setItem('viztto_cadastro_pendente', JSON.stringify({ name, email }))
        setAuth({
          user: {
            id: '',
            name,
            email,
            role: 'administrador',
            admin: false,
            workspaceId: '',
          },
          pendingEmail: email,
          emailVerified: false,
          onboardingCompleted: false,
        })
      },
      async verifyEmail(tokenInformado) {
        const token =
          tokenInformado?.trim() || sessionStorage.getItem('viztto_token_verificacao') || ''
        if (!token) throw new Error('Abra o link de verificacao enviado para o e-mail.')
        const r = await autenticacaoApi.verificar(token)
        sessionStorage.setItem('viztto_usuario_pendente', r.usuarioId)
        sessionStorage.setItem(
          'viztto_cadastro_pendente',
          JSON.stringify({ name: r.nome, email: r.email }),
        )
        sessionStorage.removeItem('viztto_token_verificacao')
        setAuth({
          user: {
            id: r.usuarioId,
            name: r.nome,
            email: r.email,
            role: 'administrador',
            admin: false,
            workspaceId: '',
          },
          pendingEmail: r.email,
          emailVerified: true,
          onboardingCompleted: false,
        })
      },
      async resendVerification() {
        const email =
          auth.pendingEmail ||
          auth.user?.email ||
          (JSON.parse(sessionStorage.getItem('viztto_cadastro_pendente') || '{}') as { email?: string })
            .email
        if (!email) throw new Error('Informe o e-mail da conta para reenviar a verificacao.')
        const r = await autenticacaoApi.reenviarVerificacao(email)
        if (r.tokenVerificacao)
          sessionStorage.setItem('viztto_token_verificacao', r.tokenVerificacao)
      },
      async completeOnboarding(nome, slug) {
        const usuarioId = auth.user?.id || sessionStorage.getItem('viztto_usuario_pendente')
        if (!usuarioId) throw new Error('Sessao de cadastro nao encontrada.')
        await autenticacaoApi.onboarding(usuarioId, nome, slug)
        const { sessao } = await autenticacaoApi.sessao()
        setAuth({
          user: usuarioDaSessao(sessao),
          pendingEmail: sessao.usuarioEmail,
          emailVerified: true,
          onboardingCompleted: true,
        })
        sessionStorage.removeItem('viztto_usuario_pendente')
        sessionStorage.removeItem('viztto_token_verificacao')
        sessionStorage.removeItem('viztto_cadastro_pendente')
      },
      async switchWorkspace(workspaceId) {
        await autenticacaoApi.trocarWorkspace(workspaceId)
        const { sessao } = await autenticacaoApi.sessao()
        setAuth((atual) => ({
          ...atual,
          user: usuarioDaSessao(sessao),
        }))
      },
      async logout() {
        await autenticacaoApi.sair()
        setAuth(vazio)
      },
      async resetAuth() {
        try {
          await autenticacaoApi.sair()
        } catch {
          /* sessao ja ausente */
        }
        setAuth(vazio)
      },
    }),
    [auth, loading],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return value
}
