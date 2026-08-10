import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import { PROJECT_STATUS_OPTIONS, PROJECT_TYPES } from '@/lib/projectCatalog'
import type { Client, ProjectStatus, TeamMember } from '@/types/domain'
import { SettingsSection } from './SettingsSection'

type Props = {
  name: string
  description: string
  clientId: string
  type: string
  responsavelId: string
  startDate: string
  dueDate: string
  status: ProjectStatus
  clients: Client[]
  membrosAtivos: TeamMember[]
  approverIds: string[]
  infoSaving: boolean
  infoSaved: boolean
  infoErro: string
  onName: (value: string) => void
  onDescription: (value: string) => void
  onClientId: (value: string) => void
  onType: (value: string) => void
  onResponsavelId: (value: string) => void
  onStartDate: (value: string) => void
  onDueDate: (value: string) => void
  onStatus: (value: ProjectStatus) => void
  onSalvar: () => void
}

export function GeneralSettings(props: Props) {
  return (
    <SettingsSection
      title="Informações do projeto"
      description="Nome, cliente, datas e status exibidos na equipe e no portal."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Nome" value={props.name} onChange={(e) => props.onName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Descrição"
            value={props.description}
            onChange={(e) => props.onDescription(e.target.value)}
          />
        </div>
        <Select
          label="Cliente"
          value={props.clientId}
          onChange={(e) => props.onClientId(e.target.value)}
        >
          {props.clients
            .filter((item) => item.status === 'active' || item.id === props.clientId)
            .map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.name}
              </option>
            ))}
        </Select>
        <Select label="Tipo" value={props.type} onChange={(e) => props.onType(e.target.value)}>
          {PROJECT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Responsável"
          value={props.responsavelId}
          onChange={(e) => props.onResponsavelId(e.target.value)}
        >
          <option value="">Sem responsável</option>
          {props.membrosAtivos.map((membro) => {
            const bloqueado = props.approverIds.includes(membro.id)
            return (
              <option key={membro.id} value={membro.id} disabled={bloqueado}>
                {bloqueado
                  ? `${membro.name} — Indisponível (já é aprovador)`
                  : membro.name}
              </option>
            )
          })}
        </Select>
        <Select
          label="Status"
          value={props.status}
          onChange={(e) => props.onStatus(e.target.value as ProjectStatus)}
        >
          {PROJECT_STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          label="Início"
          type="date"
          value={props.startDate}
          onChange={(e) => props.onStartDate(e.target.value)}
        />
        <Input
          label="Prazo"
          type="date"
          value={props.dueDate}
          onChange={(e) => props.onDueDate(e.target.value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" loading={props.infoSaving} onClick={props.onSalvar}>
          {props.infoSaved && !props.infoSaving
            ? 'Salvo ✓'
            : props.infoSaving
              ? 'Salvando...'
              : 'Salvar informações'}
        </Button>
        {props.infoSaved && !props.infoErro && (
          <p role="status" className="text-sm text-approval">
            Alterações salvas.
          </p>
        )}
        {props.infoErro && (
          <p role="alert" className="text-sm text-revision">
            {props.infoErro}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}
