import { CheckCircle2, MessageSquare, Minus, Plus } from 'lucide-react'
import {
  ApprovalStamp,
  CommentCard,
  CommentPin,
  HistoryLine,
  StatusBadge,
  VersionBadge,
} from '@/components/feedback/FeedbackComponents'
import { AvatarGroup, Badge, Breadcrumb } from '@/components/ui/DataDisplay'
import { organizedVersions } from '@/data/problemDemo'

export function OrganizedWorkspace() {
  return (
    <article
      aria-label="Revisão organizada da Campanha de agosto no Viztto"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
        <div>
          <div className="hidden sm:block">
            <Breadcrumb items={['Campanha de agosto', 'Carrossel principal']} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold sm:text-base">Carrossel principal</h3>
            <VersionBadge current>v4</VersionBadge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AvatarGroup names={['Marina', 'Rafael', 'Bianca']} />
          <Badge tone="brand">Alterações organizadas</Badge>
        </div>
      </header>

      <div className="grid lg:grid-cols-[150px_minmax(0,1fr)_250px]">
        <aside className="order-2 border-t border-line p-3 lg:order-none lg:border-r lg:border-t-0">
          <p className="eyebrow mb-3">Versões</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
            {organizedVersions.map((version, index) => (
              <div
                key={version}
                className="min-w-40 rounded-md border border-line bg-background px-3 py-2 lg:min-w-0"
              >
                <div className="flex items-center gap-2">
                  <VersionBadge current={index === 3}>{`v${index + 1}`}</VersionBadge>
                  {index === 3 && <span className="text-[10px] text-brand">Atual</span>}
                </div>
                <p className="mt-1 truncate text-[10px] text-muted">{version.split(' · ')[1]}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative min-h-[370px] overflow-hidden bg-surface-secondary p-4 surface-grid sm:min-h-[450px] sm:p-6">
          <div className="relative mx-auto h-[340px] max-w-[450px] overflow-hidden rounded-md border border-line bg-[#171a18] shadow-soft sm:h-[400px]">
            <div
              aria-hidden="true"
              className="absolute -left-14 top-10 h-48 w-48 rotate-12 border-[30px] border-accent/75"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-16 -right-12 h-56 w-56 rounded-full border-[36px] border-brand/80"
            />
            <div className="absolute left-[9%] top-[9%] text-[9px] uppercase tracking-[0.18em] text-brand">
              Campanha de agosto · 04/06
            </div>
            <p className="absolute left-[9%] top-[29%] text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.8] tracking-[-0.07em]">
              IDEIAS
              <br />
              <span className="font-serif font-normal italic text-accent">em foco</span>
            </p>
            <p className="absolute bottom-[9%] left-[9%] max-w-40 text-[9px] leading-relaxed text-secondary">
              Uma campanha vista, comentada e aprovada no mesmo contexto.
            </p>
            <div className="absolute left-[22%] top-[23%]">
              <CommentPin number={1} state="resolved" />
            </div>
            <div className="absolute right-[22%] top-[38%]">
              <CommentPin number={2} state="active" />
            </div>
            <div className="absolute bottom-[22%] left-[42%]">
              <CommentPin number={3} state="pending" />
            </div>
            <div className="absolute bottom-[7%] right-[7%]">
              <ApprovalStamp />
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-background px-2 py-1 text-[10px] text-muted">
            <Minus className="h-3 w-3" /> 86% <Plus className="h-3 w-3" />
          </div>
        </div>

        <aside className="order-3 border-t border-line bg-surface p-3 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Comentários</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
              <MessageSquare className="h-3 w-3" />3
            </span>
          </div>
          <div className="mt-3">
            <CommentCard
              compact
              name="Rafael Lima"
              time="há 3 min"
              comment="Ajuste aplicado na versão 4. O título agora mantém contraste em todos os formatos."
              status="resolved"
            />
          </div>
          <div className="mt-3 rounded-md border border-line bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">Bianca Alves</p>
              <StatusBadge status="changes" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              Revisar a legenda antes da aprovação final.
            </p>
            <div className="mt-2 flex items-center justify-between">
              <VersionBadge>v4</VersionBadge>
              <span className="text-[10px] text-muted">Responsável: Marina</span>
            </div>
          </div>
          <div className="mt-4 max-h-40 overflow-hidden border-t border-line pt-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-approval" />
              <p className="eyebrow">Histórico</p>
            </div>
            <HistoryLine />
          </div>
        </aside>
      </div>
    </article>
  )
}
