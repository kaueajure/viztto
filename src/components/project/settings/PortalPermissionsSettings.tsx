import { Switch } from '@/components/ui/FormControls'
import type { PortalPermissoes } from './settingsHelpers'

type Props = {
  value: PortalPermissoes
  onChange: (value: PortalPermissoes) => void
}

export function PortalPermissionsSettings({ value, onChange }: Props) {
  return (
    <div className="mt-5 grid gap-3">
      <p className="text-sm font-medium text-ink">Permissões do cliente</p>
      <Switch
        label="Permitir comentários"
        checked={value.permitirComentarios}
        onChange={(checked) => onChange({ ...value, permitirComentarios: checked })}
      />
      <Switch
        label="Permitir aprovação"
        checked={value.permitirAprovacao}
        onChange={(checked) => onChange({ ...value, permitirAprovacao: checked })}
      />
      <Switch
        label="Permitir solicitação de alterações"
        checked={value.permitirSolicitacaoAlteracoes}
        onChange={(checked) => onChange({ ...value, permitirSolicitacaoAlteracoes: checked })}
      />
      <Switch
        label="Permitir downloads"
        checked={value.permitirDownloads}
        onChange={(checked) => onChange({ ...value, permitirDownloads: checked })}
      />
      <Switch
        label="Permitir versões antigas"
        checked={value.permitirVersoesAntigas}
        onChange={(checked) => onChange({ ...value, permitirVersoesAntigas: checked })}
      />
    </div>
  )
}
