import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/FormControls'
import type { TeamMember } from '@/types/domain'
import { SettingsSection } from './SettingsSection'
import { inicialNome, type PermissaoParticipante } from './settingsHelpers'

type Props = {
  membrosAtivos: TeamMember[]
  memberIds: string[]
  participantesVisiveis: TeamMember[]
  permissoes: Map<string, PermissaoParticipante>
  participantesSaving: boolean
  participantesMsg: string
  participantesErro: string
  onToggleMembros: (id: string, checked: boolean) => void
  onAtualizarPermissao: (
    usuarioId: string,
    campo: keyof PermissaoParticipante,
    valor: boolean,
  ) => void
  onSalvar: () => void
}

export function ParticipantsSettings(props: Props) {
  return (
    <SettingsSection
      title="Participantes"
      description="Membros internos da equipe que acompanham o projeto. A aprovação final é feita pelos contatos externos do Cliente 2."
    >
      <div>
        <p className="text-sm font-medium text-ink">Responsáveis</p>
        <p className="mt-1 text-xs text-secondary">Membros que acompanham o projeto.</p>
        <div className="mt-3 grid gap-2">
          {props.membrosAtivos.map((membro) => (
            <Checkbox
              key={`resp-${membro.id}`}
              label={membro.name}
              checked={props.memberIds.includes(membro.id)}
              onChange={(checked) => props.onToggleMembros(membro.id, checked)}
            />
          ))}
          {!props.membrosAtivos.length && (
            <p className="text-sm text-muted">Nenhum membro ativo.</p>
          )}
        </div>
      </div>

      <div className="mt-5 divide-y divide-line rounded-md border border-line">
        {props.participantesVisiveis.map((membro) => {
          const perms = props.permissoes.get(membro.id) ?? {
            podeEnviarMateriais: true,
            podeResponderComentarios: true,
          }
          return (
            <div
              key={membro.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                  {inicialNome(membro.name)}
                </span>
                <div>
                  <p className="font-medium text-ink">{membro.name}</p>
                  <p className="text-xs text-muted">{membro.email}</p>
                  <p className="mt-1 text-xs text-secondary">{membro.role} · Responsável</p>
                </div>
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <Checkbox
                  label="Pode enviar materiais"
                  checked={perms.podeEnviarMateriais}
                  onChange={(checked) =>
                    props.onAtualizarPermissao(membro.id, 'podeEnviarMateriais', checked)
                  }
                />
                <Checkbox
                  label="Pode responder comentários"
                  checked={perms.podeResponderComentarios}
                  onChange={(checked) =>
                    props.onAtualizarPermissao(membro.id, 'podeResponderComentarios', checked)
                  }
                />
              </div>
            </div>
          )
        })}
        {!props.participantesVisiveis.length && (
          <p className="p-4 text-sm text-muted">Nenhum participante selecionado.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" loading={props.participantesSaving} onClick={props.onSalvar}>
          Salvar participantes
        </Button>
        {props.participantesMsg && (
          <p role="status" className="text-sm text-approval">
            {props.participantesMsg}
          </p>
        )}
        {props.participantesErro && (
          <p role="alert" className="text-sm text-revision">
            {props.participantesErro}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}
