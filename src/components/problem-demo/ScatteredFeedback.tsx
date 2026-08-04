import { AlertCircle, CircleHelp, CornerDownRight } from 'lucide-react'
import { AudioMessage } from './AudioMessage'
import { EmailPreview } from './EmailPreview'
import { FileVersion } from './FileVersion'
import { MessageBubble } from './MessageBubble'
import { Badge } from '@/components/ui/DataDisplay'
import { duplicatedFiles, looseComments } from '@/data/problemDemo'

export function ScatteredFeedback() {
  return (
    <div
      role="group"
      aria-label="Mensagens, arquivos duplicados, áudio, e-mail e comentários sem contexto espalhados em diferentes canais"
      className="relative grid gap-3 lg:h-[590px] lg:block"
    >
      <div
        data-chaos-item
        data-shift-x="250"
        data-shift-y="150"
        className="lg:absolute lg:left-[2%] lg:top-[4%] lg:-rotate-2"
      >
        <MessageBubble />
      </div>
      <div
        data-chaos-item
        data-shift-x="-250"
        data-shift-y="165"
        className="lg:absolute lg:right-[1%] lg:top-[2%] lg:rotate-1"
      >
        <EmailPreview />
      </div>
      <div
        data-chaos-item
        data-shift-x="260"
        data-shift-y="-85"
        className="lg:absolute lg:bottom-[7%] lg:left-[8%] lg:rotate-1"
      >
        <AudioMessage />
      </div>

      <div
        data-chaos-item
        data-shift-x="-270"
        data-shift-y="20"
        className="grid gap-1.5 lg:absolute lg:right-[4%] lg:top-[38%] lg:w-[330px] lg:-rotate-1"
      >
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted">
          <span>6 arquivos encontrados</span>
          <Badge tone="revision">Qual é o final?</Badge>
        </div>
        {duplicatedFiles.slice(0, 4).map((file, index) => (
          <FileVersion key={file} name={file} emphasized={index === 3} />
        ))}
        <div className="hidden gap-1.5 sm:grid">
          {duplicatedFiles.slice(4).map((file) => (
            <FileVersion key={file} name={file} />
          ))}
        </div>
      </div>

      <div
        data-chaos-item
        data-shift-x="75"
        data-shift-y="125"
        className="rounded-lg border border-line bg-surface p-4 shadow-soft lg:absolute lg:left-[34%] lg:top-[17%] lg:w-[260px] lg:rotate-2"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          <CircleHelp className="h-3.5 w-3.5 text-revision" /> Sem contexto
        </div>
        <div className="mt-3 grid gap-2">
          {looseComments.slice(0, 3).map((comment) => (
            <p key={comment} className="flex gap-2 text-xs leading-relaxed text-secondary">
              <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-revision" />
              {comment}
            </p>
          ))}
        </div>
      </div>

      <div
        data-chaos-item
        data-shift-x="-40"
        data-shift-y="-150"
        className="flex max-w-[310px] flex-wrap gap-2 lg:absolute lg:bottom-[3%] lg:left-[43%] lg:rotate-1"
      >
        <Badge tone="warning">Aguardando resposta</Badge>
        <Badge tone="revision">Alteração enviada</Badge>
        <Badge>Aprovado?</Badge>
        <Badge tone="brand">Nova versão</Badge>
        <Badge tone="warning">Pendente</Badge>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[29%] top-[36%] hidden items-center gap-2 text-[10px] text-revision lg:flex"
      >
        <AlertCircle className="h-3 w-3" /> pertence a qual versão?
      </div>
    </div>
  )
}
