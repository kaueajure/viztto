import { Input, Select } from '@/components/ui/FormControls'
import type { ExpiracaoPreset } from './settingsHelpers'

type Props = {
  senhaPortal: string
  protegido: boolean
  expiraPreset: ExpiracaoPreset
  expiraEm: string
  onSenhaPortal: (value: string) => void
  onExpiraPreset: (value: ExpiracaoPreset) => void
  onExpiraEm: (value: string) => void
}

export function PortalSecuritySettings({
  senhaPortal,
  protegido,
  expiraPreset,
  expiraEm,
  onSenhaPortal,
  onExpiraPreset,
  onExpiraEm,
}: Props) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Input
        label={protegido ? 'Nova senha do portal' : 'Senha do portal'}
        type="password"
        value={senhaPortal}
        placeholder={protegido ? 'Deixe em branco para manter' : 'Opcional'}
        onChange={(event) => onSenhaPortal(event.target.value)}
      />
      <Select
        label="Expiração do link"
        value={expiraPreset}
        onChange={(event) => onExpiraPreset(event.target.value as ExpiracaoPreset)}
      >
        <option value="nenhuma">Sem expiração</option>
        <option value="7">7 dias</option>
        <option value="30">30 dias</option>
        <option value="personalizada">Data personalizada</option>
      </Select>
      {expiraPreset === 'personalizada' && (
        <Input
          label="Data de expiração"
          type="date"
          value={expiraEm}
          onChange={(event) => onExpiraEm(event.target.value)}
        />
      )}
    </div>
  )
}
