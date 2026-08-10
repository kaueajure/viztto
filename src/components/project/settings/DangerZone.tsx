import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import type { ProjectStatus } from '@/types/domain'
import { SettingsSection } from './SettingsSection'

type Props = {
  projectName: string
  status: ProjectStatus
  confirmExcluir: string
  dangerSaving: boolean
  dangerMsg: string
  dangerErro: string
  onConfirmExcluir: (value: string) => void
  onArquivar: () => void
  onRestaurar: () => void
  onExcluir: () => void
}

export function DangerZone(props: Props) {
  return (
    <SettingsSection
      title="Zona de perigo"
      description="Ações irreversíveis ou que removem o projeto da lista ativa."
      danger
    >
      <div className="flex flex-wrap gap-3">
        {props.status !== 'archived' ? (
          <Button
            type="button"
            variant="outline"
            loading={props.dangerSaving}
            onClick={props.onArquivar}
          >
            Arquivar projeto
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            loading={props.dangerSaving}
            onClick={props.onRestaurar}
          >
            Restaurar projeto
          </Button>
        )}
      </div>

      <div className="mt-6 border-t border-revision/30 pt-5">
        <p className="text-sm font-medium text-revision">Excluir projeto</p>
        <p className="mt-1 text-xs text-secondary">
          Digite <span className="font-semibold text-ink">{props.projectName}</span> para confirmar.
        </p>
        <div className="mt-3 max-w-md">
          <Input
            label="Confirmação"
            value={props.confirmExcluir}
            onChange={(event) => props.onConfirmExcluir(event.target.value)}
            placeholder={props.projectName}
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          className="mt-3"
          loading={props.dangerSaving}
          disabled={props.confirmExcluir.trim() !== props.projectName}
          onClick={props.onExcluir}
        >
          Excluir permanentemente
        </Button>
      </div>

      {props.dangerMsg && (
        <p role="status" className="mt-3 text-sm text-approval">
          {props.dangerMsg}
        </p>
      )}
      {props.dangerErro && (
        <p role="alert" className="mt-3 text-sm text-revision">
          {props.dangerErro}
        </p>
      )}
    </SettingsSection>
  )
}
