import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CriarEmpresaModal } from '@/components/auth/CriarEmpresaModal'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/FormControls'
import { ApiError } from '@/services/api/clienteHttp'
import { autenticacaoApi } from '@/services/api/autenticacaoApi'

function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-85px)] max-w-page items-center gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="hidden max-w-lg lg:block">
        <span className="grid h-12 w-12 place-items-center rounded-lg border border-brand/30 bg-brand-soft text-brand">
          <ShieldCheck />
        </span>
        <p className="mt-6 text-3xl font-semibold tracking-tight">
          Feedback, versões e aprovações organizados desde o primeiro acesso.
        </p>
        <div className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-soft">
          <p className="eyebrow">Campanha de agosto</p>
          <div className="mt-4 flex items-center justify-between rounded-md bg-surface-secondary p-4">
            <span>Carrossel principal</span>
            <span className="rounded-full bg-approval-soft px-2 py-1 text-xs text-approval">
              Aprovado · v4
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-secondary">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  )
}

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export function LoginPage() {
  const navigate = useNavigate()
  const { login, resendVerification } = useAuth()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [precisaVerificar, setPrecisaVerificar] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!validEmail(email)) next.email = 'Informe um e-mail válido.'
    if (password.length < 6) next.password = 'Use pelo menos seis caracteres.'
    setErrors(next)
    setPrecisaVerificar(false)
    setReenviado(false)
    if (next.email) return emailRef.current?.focus()
    if (next.password) return passwordRef.current?.focus()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/app/inicio')
    } catch (error) {
      if (error instanceof ApiError && error.codigo === 'email_nao_verificado') {
        sessionStorage.setItem(
          'viztto_cadastro_pendente',
          JSON.stringify({ name: '', email: email.trim().toLowerCase() }),
        )
        setPrecisaVerificar(true)
        setErrors({
          form: 'Seu e-mail ainda nao foi verificado. Reenvie o link ou abra a mensagem que enviamos.',
        })
      } else {
        setErrors({ form: error instanceof Error ? error.message : 'Nao foi possivel entrar.' })
      }
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <AuthCard
      eyebrow="Acesso ao Viztto"
      title="Entre no seu espaço de revisão"
      description="Acesse seus clientes, projetos, materiais e aprovações."
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Input
          ref={emailRef}
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          ref={passwordRef}
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox label="Lembrar acesso" checked={remember} onChange={setRemember} />
          <Link className="text-sm text-brand hover:underline" to="/esqueci-senha">
            Esqueci minha senha
          </Link>
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-revision">
            {errors.form}
          </p>
        )}
        {reenviado && (
          <p role="status" className="text-sm text-approval">
            Novo e-mail de verificacao enviado. Confira sua caixa de entrada.
          </p>
        )}
        <Button type="submit" className="w-full" loading={submitting}>
          Entrar
        </Button>
        {precisaVerificar && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            loading={reenviando}
            onClick={async () => {
              setReenviando(true)
              setReenviado(false)
              try {
                sessionStorage.setItem(
                  'viztto_cadastro_pendente',
                  JSON.stringify({ name: '', email: email.trim().toLowerCase() }),
                )
                await resendVerification(email.trim().toLowerCase())
                setReenviado(true)
                navigate(`/verificar-email?email=${encodeURIComponent(email.trim().toLowerCase())}`)
              } catch (erro) {
                setErrors({
                  form: erro instanceof Error ? erro.message : 'Nao foi possivel reenviar.',
                })
              } finally {
                setReenviando(false)
              }
            }}
          >
            Reenviar e-mail de verificação
          </Button>
        )}
        <p className="text-center text-sm text-secondary">
          Ainda não tem acesso?{' '}
          <Link className="font-semibold text-brand" to="/criar-conta">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { register, resendVerification } = useAuth()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '',
    email: params.get('email') ?? '',
    password: '',
    confirm: '',
  })
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value })
  const [submitting, setSubmitting] = useState(false)
  const [precisaVerificar, setPrecisaVerificar] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Informe seu nome.'
    if (!validEmail(form.email)) next.email = 'Informe um e-mail válido.'
    if (
      form.password.length < 8 ||
      !/[A-Za-zÀ-ÿ]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    )
      next.password = 'Use pelo menos oito caracteres, com uma letra e um número.'
    if (form.confirm !== form.password) next.confirm = 'As senhas precisam ser iguais.'
    if (!terms) next.terms = 'Você precisa aceitar os termos para continuar.'
    setErrors(next)
    setPrecisaVerificar(false)
    setReenviado(false)
    if (next.name) return nameRef.current?.focus()
    if (next.email) return emailRef.current?.focus()
    if (next.password || next.confirm) return passwordRef.current?.focus()
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/verificar-email')
    } catch (error) {
      if (error instanceof ApiError && error.codigo === 'email_nao_verificado') {
        sessionStorage.setItem(
          'viztto_cadastro_pendente',
          JSON.stringify({ name: form.name, email: form.email.trim().toLowerCase() }),
        )
        setPrecisaVerificar(true)
        setErrors({
          form: 'Este e-mail ja possui cadastro, mas ainda nao foi verificado.',
        })
      } else {
        setErrors({
          form: error instanceof Error ? error.message : 'Nao foi possivel criar a conta.',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <AuthCard
      eyebrow="Começar gratuitamente"
      title="Crie seu espaço no Viztto"
      description="Comece com sua equipe, clientes e projetos em um único fluxo."
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Input
          ref={nameRef}
          label="Nome"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <Input
          ref={emailRef}
          label="E-mail"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <Input
          ref={passwordRef}
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <Checkbox
          label="Concordo com os termos e a política de privacidade."
          checked={terms}
          onChange={setTerms}
        />
        {errors.terms && (
          <p role="alert" className="text-xs text-revision">
            {errors.terms}
          </p>
        )}
        {errors.form && (
          <p role="alert" className="text-sm text-revision">
            {errors.form}
          </p>
        )}
        {reenviado && (
          <p role="status" className="text-sm text-approval">
            Novo e-mail de verificacao enviado. Confira sua caixa de entrada.
          </p>
        )}
        <Button type="submit" className="w-full" loading={submitting}>
          Criar conta gratuitamente
        </Button>
        {precisaVerificar && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            loading={reenviando}
            onClick={async () => {
              setReenviando(true)
              setReenviado(false)
              try {
                await resendVerification(form.email.trim().toLowerCase())
                setReenviado(true)
                navigate(
                  `/verificar-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`,
                )
              } catch (erro) {
                setErrors({
                  form: erro instanceof Error ? erro.message : 'Nao foi possivel reenviar.',
                })
              } finally {
                setReenviando(false)
              }
            }}
          >
            Reenviar e-mail de verificação
          </Button>
        )}
        <p className="text-center text-sm text-secondary">
          Já possui conta?{' '}
          <Link className="font-semibold text-brand" to="/entrar">
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validEmail(email)) return setError('Informe um e-mail válido.')
    setSubmitting(true)
    setError('')
    try {
      const resposta = await autenticacaoApi.esqueciSenha(email.trim().toLowerCase())
      if (resposta.tokenRecuperacao)
        sessionStorage.setItem('viztto_token_recuperacao', resposta.tokenRecuperacao)
      setSent(true)
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : 'Não foi possível enviar as instruções.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <AuthCard
      eyebrow="Recuperação de acesso"
      title="Recupere seu acesso"
      description="Informe seu e-mail para receber um link seguro de redefinição."
    >
      {sent ? (
        <div role="status" className="rounded-lg border border-approval/30 bg-approval-soft p-5">
          <CheckCircle2 className="text-approval" />
          <p className="mt-3 font-semibold">Instruções enviadas</p>
          <p className="mt-1 text-sm text-secondary">
            Enviamos as instruções de recuperação para o e-mail informado.
          </p>
          <Link to="/entrar" className="mt-5 inline-block text-sm font-semibold text-brand">
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" loading={submitting}>
            Enviar instruções
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || sessionStorage.getItem('viztto_token_recuperacao') || ''
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  return (
    <AuthCard
      eyebrow="Segurança"
      title="Crie uma nova senha"
      description="O link pode ser usado uma única vez e expira em uma hora."
    >
      {done ? (
        <div role="status" className="rounded-lg border border-approval/30 bg-approval-soft p-5">
          <CheckCircle2 className="text-approval" />
          <p className="mt-3 font-semibold">Senha atualizada</p>
          <Link to="/entrar" className="mt-5 inline-block text-sm font-semibold text-brand">
            Entrar no Viztto
          </Link>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!token) return setError('Abra o link enviado para o seu e-mail.')
            if (senha.length < 8 || !/[A-Za-zÀ-ÿ]/.test(senha) || !/[0-9]/.test(senha))
              return setError('Use pelo menos oito caracteres, com uma letra e um número.')
            if (senha !== confirmacao) return setError('As senhas precisam ser iguais.')
            setSubmitting(true)
            setError('')
            try {
              await autenticacaoApi.redefinirSenha(token, senha)
              sessionStorage.removeItem('viztto_token_recuperacao')
              setDone(true)
            } catch (erro) {
              setError(erro instanceof Error ? erro.message : 'Não foi possível redefinir a senha.')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            error={error}
          />
          <Button type="submit" loading={submitting}>
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [status, setStatus] = useState<'loading' | 'done' | 'account' | 'error'>('loading')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Convite ausente.')
      return
    }
    void autenticacaoApi
      .aceitarConvite(token)
      .then((r) => {
        setMessage(r.mensagem)
        setStatus('done')
      })
      .catch((erro) => {
        if (erro instanceof ApiError && erro.codigo === 'conta_necessaria') setStatus('account')
        else {
          setMessage(erro instanceof Error ? erro.message : 'Não foi possível aceitar o convite.')
          setStatus('error')
        }
      })
  }, [token])
  return (
    <AuthCard
      eyebrow="Convite de equipe"
      title="Entre no workspace"
      description="Confirme o convite enviado ao seu e-mail."
    >
      {status === 'loading' && <p role="status">Validando convite...</p>}
      {status === 'done' && (
        <>
          <p className="text-approval">{message}</p>
          <Link className="mt-5 inline-block font-semibold text-brand" to="/entrar">
            Entrar no Viztto
          </Link>
        </>
      )}
      {status === 'account' && (
        <>
          <p>Crie e verifique uma conta usando o e-mail convidado.</p>
          <Link
            className="mt-5 inline-block font-semibold text-brand"
            to={`/criar-conta?email=${encodeURIComponent(email)}`}
          >
            Criar conta
          </Link>
        </>
      )}
      {status === 'error' && (
        <p role="alert" className="text-revision">
          {message}
        </p>
      )}
    </AuthCard>
  )
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const {
    user,
    pendingEmail,
    emailVerified,
    onboardingCompleted,
    verifyEmail,
    resendVerification,
    completeOnboarding,
  } = useAuth()
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'verificando' | 'ok'>('idle')
  const [temTokenLocal, setTemTokenLocal] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [modalEmpresa, setModalEmpresa] = useState(false)
  const emailQuery = params.get('email')?.trim().toLowerCase() || ''
  const [emailManual, setEmailManual] = useState(emailQuery || pendingEmail || '')
  const tokenUrl = params.get('token')?.trim() || ''
  const podeSimularDev = temTokenLocal && !tokenUrl
  const emailAtual = pendingEmail || emailManual || emailQuery

  useEffect(() => {
    setTemTokenLocal(Boolean(sessionStorage.getItem('viztto_token_verificacao')))
    if (emailQuery) {
      sessionStorage.setItem(
        'viztto_cadastro_pendente',
        JSON.stringify({
          name:
            (
              JSON.parse(sessionStorage.getItem('viztto_cadastro_pendente') || '{}') as {
                name?: string
              }
            ).name || '',
          email: emailQuery,
        }),
      )
      setEmailManual(emailQuery)
    }
  }, [emailQuery])

  useEffect(() => {
    if (emailVerified && !onboardingCompleted) setModalEmpresa(true)
  }, [emailVerified, onboardingCompleted])

  useEffect(() => {
    if (!cooldown) return
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!tokenUrl || status !== 'idle') return
    let ativo = true
    setStatus('verificando')
    void verifyEmail(tokenUrl)
      .then((conviteAceito) => {
        if (!ativo) return
        setStatus('ok')
        if (!conviteAceito) setModalEmpresa(true)
      })
      .catch((erro) => {
        if (!ativo) return
        setStatus('idle')
        setError(erro instanceof Error ? erro.message : 'Nao foi possivel verificar.')
      })
    return () => {
      ativo = false
    }
  }, [tokenUrl, status, verifyEmail])

  return (
    <>
      <AuthCard
        eyebrow="Confirme seu endereço"
        title="Verifique seu e-mail"
        description="Abrimos um link seguro no seu e-mail para confirmar a conta."
      >
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
            <Mail />
          </span>
          <p className="mt-5 text-sm text-secondary">
            {status === 'verificando'
              ? 'Confirmando seu e-mail...'
              : status === 'ok' || emailVerified
                ? 'E-mail confirmado. Finalize a criação da sua empresa.'
                : 'Enviamos um link para'}
          </p>
          {emailAtual ? (
            <p className="mt-1 font-semibold">{emailAtual}</p>
          ) : (
            <div className="mt-4 text-left">
              <Input
                label="E-mail da conta"
                type="email"
                value={emailManual}
                onChange={(e) => setEmailManual(e.target.value)}
              />
            </div>
          )}
          {podeSimularDev && !emailVerified && (
            <Button
              className="mt-7 w-full"
              onClick={async () => {
                try {
                  const conviteAceito = await verifyEmail()
                  setStatus('ok')
                  if (!conviteAceito) setModalEmpresa(true)
                } catch (erro) {
                  setError(erro instanceof Error ? erro.message : 'Nao foi possivel verificar.')
                }
              }}
            >
              Usar token de desenvolvimento
            </Button>
          )}
          {reenviado && (
            <p role="status" className="mt-3 text-sm text-approval">
              Novo e-mail enviado. Confira sua caixa de entrada e o spam.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-revision">
              {error}
            </p>
          )}
          {!emailVerified && (
            <Button
              variant={podeSimularDev ? 'ghost' : 'primary'}
              className={podeSimularDev ? 'mt-2 w-full' : 'mt-7 w-full'}
              disabled={cooldown > 0 || status === 'verificando'}
              onClick={async () => {
                try {
                  setError('')
                  setReenviado(false)
                  if (!validEmail(emailAtual)) {
                    setError('Informe um e-mail valido para reenviar a verificacao.')
                    return
                  }
                  await resendVerification(emailAtual)
                  setReenviado(true)
                  setCooldown(30)
                } catch (erro) {
                  setError(erro instanceof Error ? erro.message : 'Nao foi possivel reenviar.')
                }
              }}
            >
              {cooldown ? `Reenviar em ${cooldown}s` : 'Reenviar e-mail'}
            </Button>
          )}
          {emailVerified && !onboardingCompleted && (
            <Button className="mt-7 w-full" onClick={() => setModalEmpresa(true)}>
              Criar empresa
            </Button>
          )}
          <Link
            to="/criar-conta"
            className="mt-4 inline-block text-sm text-secondary hover:text-brand"
          >
            Alterar o endereço
          </Link>
        </div>
      </AuthCard>
      <CriarEmpresaModal
        open={modalEmpresa && emailVerified && !onboardingCompleted}
        nomeUsuario={user?.name || ''}
        onCriar={({ nome, slug, tipo }) => completeOnboarding(nome, slug, tipo)}
        onConcluido={() => {
          setModalEmpresa(false)
          navigate('/app/inicio')
        }}
      />
    </>
  )
}
