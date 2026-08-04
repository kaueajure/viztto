import { FileText, MessageSquareText } from 'lucide-react'
import { CommentPin, StatusBadge, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { Avatar } from '@/components/ui/DataDisplay'

export function ImageReviewDemo() {
  return (
    <div
      role="group"
      aria-label="Página três de uma apresentação com comentários resolvidos e pendentes posicionados no material."
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-secondary">
        <span className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand" /> Apresentação comercial
        </span>
        <span>Página 3 de 8</span>
      </div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="relative min-h-[24rem] overflow-hidden bg-warning p-6 text-brand-contrast">
          <div
            className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-background"
            aria-hidden
          />
          <div
            className="absolute -bottom-20 left-[12%] h-48 w-48 rotate-12 border-[34px] border-accent"
            aria-hidden
          />
          <p className="relative max-w-sm text-[clamp(2.6rem,7vw,5.4rem)] font-semibold leading-[0.8] tracking-[-0.07em]">
            IDEIAS
            <br />
            <span className="font-serif font-normal italic">em contexto</span>
          </p>
          <p className="absolute bottom-6 right-6 max-w-44 text-right text-xs">
            Campanha de agosto · conceito principal
          </p>
          <div className="absolute left-[62%] top-[24%]">
            <CommentPin number={1} state="active" interactive={false} />
          </div>
          <div className="absolute bottom-[22%] left-[28%]">
            <CommentPin number={2} state="resolved" interactive={false} />
          </div>
          <div className="absolute bottom-[34%] right-[12%]">
            <CommentPin number={3} state="pending" interactive={false} />
          </div>
        </div>
        <aside className="border-t border-line bg-surface p-4 md:border-l md:border-t-0">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Comentário 1</p>
            <MessageSquareText className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-5 flex items-center gap-2">
            <Avatar name="Bianca Alves" color="bg-accent text-background" />
            <div>
              <p className="text-sm font-semibold">Bianca Alves</p>
              <p className="text-xs text-muted">há 8 min · v4</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Podemos aproximar o título do elemento principal nesta página?
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <VersionBadge current>v4</VersionBadge>
            <StatusBadge status="changes" />
          </div>
          <div className="mt-5 border-t border-line pt-4 text-xs text-secondary">
            <span className="text-approval">2 resolvidos</span> · 1 pendente
          </div>
        </aside>
      </div>
    </div>
  )
}
