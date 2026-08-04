import { useState } from 'react'
import { PageHeader } from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/DataDisplay'
import { Checkbox, Input } from '@/components/ui/FormControls'
import { Tabs } from '@/components/ui/Interactive'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'

export default function SettingsPage() {
  const { user } = useAuth()
  const { workspace, updateWorkspace, restoreDemo } = useAppData()
  const [saved, setSaved] = useState('')
  const [name, setName] = useState(workspace.name)
  const [slug, setSlug] = useState(workspace.slug)
  const [notifications, setNotifications] = useState({
    comments: true,
    changes: true,
    approvals: true,
    deadlines: true,
    email: true,
    system: true,
  })
  const general = (
    <div className="grid max-w-xl gap-4">
      <Input label="Nome" defaultValue={user?.name} />
      <Input label="E-mail" type="email" defaultValue={user?.email} />
      <Input label="Função" defaultValue={user?.role} />
      <Button onClick={() => setSaved('Perfil atualizado.')}>Salvar perfil</Button>
    </div>
  )
  const workspacePanel = (
    <div className="grid max-w-xl gap-4">
      <Input label="Nome do workspace" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        hint={`viztto.app/${slug}`}
      />
      <Input label="Logo simulado" type="file" />
      <Input label="Cor principal" type="color" defaultValue="#b8ff4f" className="h-11 p-1" />
      <Button
        onClick={() => {
          updateWorkspace({ name, slug })
          setSaved('Workspace atualizado.')
        }}
      >
        Salvar workspace
      </Button>
    </div>
  )
  const notificationPanel = (
    <div className="grid max-w-xl gap-4">
      {Object.entries({
        comments: 'Comentários',
        changes: 'Alterações',
        approvals: 'Aprovações',
        deadlines: 'Prazos',
        email: 'Notificações por e-mail',
        system: 'Notificações no sistema',
      }).map(([key, label]) => (
        <Checkbox
          key={key}
          label={label}
          checked={notifications[key as keyof typeof notifications]}
          onChange={(value) => setNotifications({ ...notifications, [key]: value })}
        />
      ))}
      <Button onClick={() => setSaved('Preferências atualizadas.')}>Salvar preferências</Button>
    </div>
  )
  const appearance = (
    <div>
      <p className="font-semibold text-ink">Tema escuro</p>
      <p className="mt-2">A identidade Deep Ink é o único tema disponível nesta versão.</p>
    </div>
  )
  const plan = (
    <div>
      <Badge tone="brand">Studio</Badge>
      <h3 className="mt-4 text-xl font-semibold text-ink">Plano atual</h3>
      <p className="mt-2">25 projetos ativos · 100 GB · até 5 pessoas.</p>
      <p className="mt-4 text-xs text-warning">
        Valores e limites provisórios durante a fase de desenvolvimento.
      </p>
      <Button
        variant="outline"
        className="mt-5"
        onClick={() => {
          restoreDemo()
          setSaved('Dados de demonstração restaurados.')
        }}
      >
        Restaurar dados de demonstração
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
      <div className="mt-6 rounded-lg border border-line bg-surface px-5">
        <Tabs
          items={[
            { label: 'Geral', content: general },
            { label: 'Workspace', content: workspacePanel },
            { label: 'Notificações', content: notificationPanel },
            { label: 'Aparência', content: appearance },
            { label: 'Plano', content: plan },
          ]}
        />
      </div>
    </div>
  )
}
