import { Radio } from '@/components/ui/FormControls'
import type { ApprovalMode, TeamMember } from '@/types/domain'
import { SettingsSection } from './SettingsSection'
import { inicialNome } from './settingsHelpers'

type Props = {
  approverIds: string[]
  membrosAtivos: TeamMember[]
  approvalMode: ApprovalMode
  variosAprovadores: boolean
  aprovacaoSaving: boolean
  aprovacaoMsg: string
  aprovacaoErro: string
  onSalvarModo: (modo: ApprovalMode) => void
}

export function ApprovalSettings(props: Props) {
  return (
    <SettingsSection
      title="Aprovadores"
      description="Quem pode finalizar materiais e como o consenso funciona."
    >
      <ul className="space-y-2 text-sm">
        {props.approverIds.map((id) => {
          const membro = props.membrosAtivos.find((item) => item.id === id)
          return (
            <li key={id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold">
                {inicialNome(membro?.name ?? '?')}
              </span>
              <span>
                {membro?.name ?? 'Usuário'}
                {membro?.email ? <span className="text-muted"> · {membro.email}</span> : null}
              </span>
            </li>
          )
        })}
        {!props.approverIds.length && (
          <li className="text-muted">Nenhum aprovador definido neste projeto.</li>
        )}
      </ul>
      <p className="mt-3 text-xs text-secondary">
        O status de aprovação de cada material continua sendo registrado nas revisões.
      </p>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-ink">Modo de aprovação</p>
        <Radio
          label="Qualquer aprovador interno pode enviar ao cliente"
          checked={props.approvalMode === 'any'}
          onChange={(checked) => {
            if (checked) props.onSalvarModo('any')
          }}
        />
        <Radio
          label="Todos os aprovadores internos precisam confirmar o envio"
          checked={props.approvalMode === 'all'}
          onChange={(checked) => {
            if (checked) props.onSalvarModo('all')
          }}
        />
        {!props.variosAprovadores && props.approvalMode === 'all' && (
          <p className="text-xs text-secondary">
            Seu plano atual limita a um aprovador; o modo “todos” será aplicado quando houver mais
            de um.
          </p>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        A aprovação final do material é sempre feita pelo Cliente 2 no portal.
      </p>
      {props.aprovacaoSaving && (
        <p role="status" className="mt-2 text-sm text-secondary">
          Salvando...
        </p>
      )}
      {props.aprovacaoMsg && (
        <p role="status" className="mt-2 text-sm text-approval">
          {props.aprovacaoMsg}
        </p>
      )}
      {props.aprovacaoErro && (
        <p role="alert" className="mt-2 text-sm text-revision">
          {props.aprovacaoErro}
        </p>
      )}
    </SettingsSection>
  )
}
