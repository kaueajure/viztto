import { ArrowRight, Bell, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, IconButton, LinkButton } from '@/components/ui/Button'
import { Checkbox, Input, Radio, Select, Switch, Textarea } from '@/components/ui/FormControls'
import { Accordion, Dropdown, Tabs, Tooltip } from '@/components/ui/Interactive'
import { ShowcaseSection } from './Showcase'

export function ControlSections() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <ShowcaseSection
        id="acoes"
        index="05"
        title="Ações"
        note="Botões preservam contraste, foco e área mínima de toque."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" icon={<Trash2 className="h-4 w-4" />}>
            Excluir
          </Button>
          <Button variant="link">Link</Button>
          <Button loading>Salvando</Button>
          <Button disabled>Desabilitado</Button>
          <Button icon={<Plus className="h-4 w-4" />}>Adicionar</Button>
          <IconButton label="Notificações">
            <Bell className="h-4 w-4" />
          </IconButton>
          <LinkButton to="/produto" variant="outline">
            Conhecer produto <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="campos" index="06" title="Campos">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Nome do material"
            placeholder="Campanha de agosto"
            hint="Visível para todos no projeto"
          />
          <Input label="Link de revisão" value="vizt.to/revisao-3" readOnly />
          <Select label="Estado da revisão" defaultValue="waiting">
            <option value="waiting">Aguardando aprovação</option>
            <option value="changes">Alterações solicitadas</option>
            <option value="approved">Aprovado</option>
          </Select>
          <Input label="Responsável" error="Escolha uma pessoa para continuar" />
          <div className="sm:col-span-2">
            <Textarea label="Comentário" placeholder="Descreva a alteração com contexto..." />
          </div>
          <div className="flex flex-col gap-3">
            <Checkbox label="Notificar participantes" checked={checked} onChange={setChecked} />
            <Radio label="Versão atual" checked />
            <Switch label="Comentários públicos" checked={checked} onChange={setChecked} />
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="interacao" index="07" title="Navegação e disclosure">
        <div className="grid gap-8">
          <div className="flex flex-wrap gap-3">
            <Dropdown
              label="Mais ações"
              items={['Duplicar versão', 'Compartilhar link', 'Arquivar material']}
            />
            <Tooltip label="Notificações do projeto">
              <IconButton label="Ver notificações">
                <Bell className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          </div>
          <Tabs
            items={[
              {
                label: 'Comentários',
                content: '12 comentários organizados no contexto da versão 3.',
              },
              { label: 'Histórico', content: 'O histórico preserva decisões, autores e horários.' },
              { label: 'Arquivos', content: 'Três versões disponíveis para comparação.' },
            ]}
          />
          <Accordion
            items={[
              {
                title: 'Quem pode aprovar?',
                content: 'Pessoas convidadas podem aprovar por link, sem cadastro obrigatório.',
              },
              {
                title: 'Como as versões são registradas?',
                content: 'Cada novo envio mantém o contexto das revisões anteriores.',
              },
            ]}
          />
        </div>
      </ShowcaseSection>
    </>
  )
}
