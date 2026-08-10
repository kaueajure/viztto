import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/FormControls'
import { SettingsSection } from './SettingsSection'
import { formatarDataHora } from './settingsHelpers'
import { PortalPermissionsSettings } from './PortalPermissionsSettings'
import { PortalSecuritySettings } from './PortalSecuritySettings'
import type { ExpiracaoPreset, PortalPermissoes } from './settingsHelpers'

type Props = {
  portalActive: boolean
  portalLink: string
  portalAcessos: number
  portalUltimoAcessoEm: string | null
  portalCriadoEm: string | null
  portalPerms: PortalPermissoes
  senhaPortal: string
  protegido: boolean
  expiraPreset: ExpiracaoPreset
  expiraEm: string
  portalSaving: boolean
  portalMsg: string
  portalErro: string
  onPortalActive: (checked: boolean) => void
  onPortalPerms: (perms: PortalPermissoes) => void
  onSenhaPortal: (value: string) => void
  onExpiraPreset: (value: ExpiracaoPreset) => void
  onExpiraEm: (value: string) => void
  onCopiarLink: () => void
  onRegenerarLink: () => void
  onRevogarLink: () => void
  onSalvar: () => void
}

export function PortalSettings(props: Props) {
  return (
    <SettingsSection
      title="Portal do cliente"
      description="Link, segurança, validade e o que o cliente pode fazer."
    >
      <Switch
        label="Portal ativo"
        checked={props.portalActive}
        onChange={(checked) => props.onPortalActive(checked)}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={props.onCopiarLink}>
          Copiar link
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!props.portalLink}
          onClick={() => {
            if (props.portalLink) window.open(props.portalLink, '_blank', 'noopener,noreferrer')
          }}
        >
          Ver portal
        </Button>
        <Button
          type="button"
          variant="outline"
          loading={props.portalSaving}
          onClick={props.onRegenerarLink}
        >
          Gerar novo link
        </Button>
        <Button type="button" variant="destructive" onClick={props.onRevogarLink}>
          Revogar link
        </Button>
      </div>

      {props.portalLink && (
        <p className="mt-3 break-all text-xs text-muted" role="status">
          {props.portalLink}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Último acesso</p>
          <p className="mt-1 text-sm">{formatarDataHora(props.portalUltimoAcessoEm)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Acessos</p>
          <p className="mt-1 text-sm">{props.portalAcessos}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Link criado em</p>
          <p className="mt-1 text-sm">{formatarDataHora(props.portalCriadoEm)}</p>
        </div>
      </div>

      <PortalPermissionsSettings value={props.portalPerms} onChange={props.onPortalPerms} />

      <PortalSecuritySettings
        senhaPortal={props.senhaPortal}
        protegido={props.protegido}
        expiraPreset={props.expiraPreset}
        expiraEm={props.expiraEm}
        onSenhaPortal={props.onSenhaPortal}
        onExpiraPreset={props.onExpiraPreset}
        onExpiraEm={props.onExpiraEm}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" loading={props.portalSaving} onClick={props.onSalvar}>
          Salvar portal
        </Button>
        {props.portalMsg && (
          <p role="status" className="text-sm text-approval">
            {props.portalMsg}
          </p>
        )}
        {props.portalErro && (
          <p role="alert" className="text-sm text-revision">
            {props.portalErro}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}
