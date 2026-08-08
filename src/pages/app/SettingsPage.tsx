import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/FormControls'
import { Tabs } from '@/components/ui/Interactive'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import { configuracoesApi, type Preferencias } from '@/services/api/configuracoesApi'
import { assinaturasApi, type UsoLimitesPlano } from '@/services/api/assinaturasApi'
import { SubscriptionPlansAdmin } from '@/components/admin/SubscriptionPlansAdmin'
import { PlanUpgradePanel } from '@/components/billing/PlanUpgradePanel'

const preferenciasPadrao: Preferencias = {
  comentarios: true,
  alteracoes: true,
  aprovacoes: true,
  prazos: true,
  email: true,
  sistema: true,
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const { workspace, updateWorkspace } = useAppData()
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [name, setName] = useState(workspace.name)
  const [slug, setSlug] = useState(workspace.slug)
  const [color, setColor] = useState('#b8ff4f')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(preferenciasPadrao)
  const [recursosPlano, setRecursosPlano] = useState<UsoLimitesPlano['recursos'] | null>(null)

  useEffect(() => {
    let active = true
    void configuracoesApi
      .carregar()
      .then(({ dado }) => {
        if (!active) return
        setProfileName(dado.perfil.nome)
        setName(dado.workspace.nome)
        setSlug(dado.workspace.slug)
        setColor(dado.workspace.corPrincipal)
        setLogoUrl(dado.workspace.logoUrl)
        setNotifications(dado.preferencias)
      })
      .catch((erro) => {
        if (active)
          setError(
            erro instanceof Error ? erro.message : 'Não foi possível carregar as configurações.',
          )
      })
    void assinaturasApi
      .limites()
      .then(({ dado }) => {
        if (active) setRecursosPlano(dado.recursos)
      })
      .catch(() => {
        if (active) setRecursosPlano(null)
      })
    return () => {
      active = false
    }
  }, [])

  const portalPersonalizado = recursosPlano?.permiteIdentidadePersonalizada
  const portalBloqueado = recursosPlano != null && !portalPersonalizado

  const execute = async (key: string, action: () => Promise<void>, message: string) => {
    setSaving(key)
    setSaved('')
    setError('')
    try {
      await action()
      setSaved(message)
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : 'Não foi possível salvar.')
    } finally {
      setSaving('')
    }
  }

  const general = (
    <div className="grid max-w-xl gap-4">
      <Input label="Nome" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
      <Input
        label="E-mail"
        type="email"
        value={user?.email ?? ''}
        disabled
        hint="A alteração de e-mail exige uma nova verificação."
      />
      <Input
        label="Função"
        value={user?.role ?? ''}
        disabled
        hint="A função é administrada pelos gestores do workspace."
      />
      <Button
        loading={saving === 'profile'}
        onClick={() =>
          void execute('profile', () => updateProfile(profileName.trim()), 'Perfil atualizado.')
        }
      >
        Salvar perfil
      </Button>
    </div>
  )
  const workspacePanel = (
    <div className="grid max-w-xl gap-4">
      <Input label="Nome do workspace" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        hint={`Portal do cliente: viztto.site/${slug || 'sua-empresa'}/{id-do-projeto}`}
      />
      <Input
        label="Cor principal do portal"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-11 p-1"
        disabled={portalBloqueado}
        hint={
          portalBloqueado
            ? 'Seu plano não libera configurar o portal próprio (cor e logo). Faça upgrade para liberar.'
            : 'Cor usada no portal de revisão do cliente.'
        }
      />
      <div className="grid gap-2">
        <p className="text-sm font-medium text-ink">Logo do portal</p>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-12 w-auto max-w-xs object-contain" />
        ) : (
          <p className="text-sm text-muted">Nenhum logo enviado.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex cursor-pointer items-center rounded-md border border-line px-3 py-2 text-sm ${
              portalBloqueado || saving === 'logo' ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Enviar logo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={portalBloqueado || saving === 'logo'}
              onChange={(event) => {
                const arquivo = event.target.files?.[0]
                event.target.value = ''
                if (!arquivo) return
                void execute(
                  'logo',
                  async () => {
                    const resposta = await configuracoesApi.enviarLogo(arquivo)
                    setLogoUrl(resposta.dado.logoUrl)
                  },
                  'Logo atualizado.',
                )
              }}
            />
          </label>
          {logoUrl && (
            <Button
              variant="ghost"
              loading={saving === 'logo-remove'}
              disabled={portalBloqueado}
              onClick={() =>
                void execute(
                  'logo-remove',
                  async () => {
                    await configuracoesApi.removerLogo()
                    setLogoUrl(null)
                  },
                  'Logo removido.',
                )
              }
            >
              Remover
            </Button>
          )}
        </div>
        {portalBloqueado && (
          <p className="text-xs text-muted">Disponível nos planos com portal próprio.</p>
        )}
      </div>
      <Button
        loading={saving === 'workspace'}
        onClick={() =>
          void execute(
            'workspace',
            async () => {
              await configuracoesApi.salvarWorkspace({
                nome: name.trim(),
                slug,
                corPrincipal: color,
              })
              updateWorkspace({ name: name.trim(), slug })
            },
            'Workspace atualizado.',
          )
        }
      >
        Salvar workspace
      </Button>
    </div>
  )
  const notificationPanel = (
    <div className="grid max-w-xl gap-4">
      {Object.entries({
        comentarios: 'Comentários',
        alteracoes: 'Alterações',
        aprovacoes: 'Aprovações',
        prazos: 'Prazos',
        email: 'Notificações por e-mail',
        sistema: 'Notificações no sistema',
      }).map(([key, label]) => (
        <Checkbox
          key={key}
          label={label}
          checked={notifications[key as keyof Preferencias]}
          onChange={(value) => setNotifications({ ...notifications, [key]: value })}
        />
      ))}
      <Button
        loading={saving === 'preferences'}
        onClick={() =>
          void execute(
            'preferences',
            async () => {
              await configuracoesApi.salvarPreferencias(notifications)
            },
            'Preferências atualizadas.',
          )
        }
      >
        Salvar preferências
      </Button>
    </div>
  )
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Perfil, workspace, notificações, aparência e plano."
      />
      {saved && (
        <p
          role="status"
          className="mt-5 rounded-md border border-approval/30 bg-approval-soft p-3 text-sm text-approval"
        >
          {saved}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-md border border-revision/30 bg-revision-soft p-3 text-sm text-revision"
        >
          {error}
        </p>
      )}
      <div className="mt-6 rounded-lg border border-line bg-surface px-5">
        <Tabs
          items={[
            { label: 'Geral', content: general },
            { label: 'Workspace', content: workspacePanel },
            { label: 'Notificações', content: notificationPanel },
            {
              label: 'Aparência',
              content: (
                <div>
                  <p className="font-semibold text-ink">Tema escuro</p>
                  <p className="mt-2">A identidade Deep Ink é o tema atual do produto.</p>
                </div>
              ),
            },
            {
              label: 'Plano',
              content: (
                <PlanUpgradePanel
                  payerEmail={user?.email ?? ''}
                  canManage={Boolean(user?.admin || user?.role === 'administrador')}
                  onPurchased={(plan) => updateWorkspace({ plan })}
                />
              ),
            },
            ...(user?.admin
              ? [{ label: 'Admin · Assinaturas', content: <SubscriptionPlansAdmin /> }]
              : []),
          ]}
        />
      </div>
    </div>
  )
}
