import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import { PROJECT_TYPES } from '@/lib/projectCatalog'
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
  onSalvar: () => void
}

const rotulosStatus: Partial<Record<ProjectStatus, string>> = {
  draft: 'Rascunho',
  'in-progress': 'Em andamento',
  'in-review': 'Aguardando revisão',
  'changes-requested': 'Alterações solicitadas',
  'waiting-approval': 'Aguardando revisão',
  approved: 'Aprovado',
  archived: 'Arquivado',
}

export function GeneralSettings(props: Props) {
  return (
    <SettingsSection
      title="Informações do projeto"
      description="Nome, cliente e datas. O status operacional é calculado automaticamente pelos materiais."
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
          {props.membrosAtivos.map((membro) => (
            <option key={membro.id} value={membro.id}>
              {membro.name}
            </option>
          ))}
        </Select>
        <div>
          <p className="text-sm font-medium text-ink">Status</p>
          <p className="mt-2 rounded-md border border-line bg-surface-secondary px-3 py-2 text-sm text-secondary">
            {rotulosStatus[props.status] ?? props.status}
            <span className="mt-1 block text-xs text-muted">Derivado automaticamente dos materiais</span>
          </p>
        </div>
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
            Informações salvas.
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
