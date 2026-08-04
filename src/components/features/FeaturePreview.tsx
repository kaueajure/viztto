import { CheckCircle2, GitCompareArrows } from 'lucide-react'
import { ImageReviewDemo } from '@/components/features/ImageReviewDemo'
import { VideoReviewDemo } from '@/components/features/VideoReviewDemo'
import { StatusBadge, VersionBadge } from '@/components/feedback/FeedbackComponents'
import type { MainFeatureId } from '@/data/features'

type FeaturePreviewProps = {
  featureId: MainFeatureId
}

const versionRows = [
  { version: 'v1', label: 'Primeiro envio', approved: false, current: false },
  { version: 'v2', label: 'Ajuste de composição', approved: false, current: false },
  { version: 'v3', label: 'Versão aprovada', approved: true, current: false },
  { version: 'v4', label: 'Versão atual', approved: false, current: true },
] as const

const approvalEvents = [
  { label: 'Nova versão publicada', meta: 'v4 · hoje, 13:52', approved: false },
  { label: 'Revisão concluída', meta: 'Marina · hoje, 14:08', approved: false },
  { label: 'Versão aprovada', meta: 'Marina · hoje, 14:16', approved: true },
] as const

function VersionsPreview() {
  return (
    <div
      role="group"
      aria-label="Histórico com quatro versões, incluindo a versão aprovada e a versão atual."
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <GitCompareArrows className="h-4 w-4 text-brand" /> Histórico de versões
        </span>
        <VersionBadge current>v4 atual</VersionBadge>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="relative min-h-64 overflow-hidden rounded-lg border border-line bg-background p-6 surface-grid sm:min-h-80">
          <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border-[30px] border-brand/80" />
          <div className="absolute bottom-10 left-8 h-1 w-24 rotate-[-7deg] bg-revision" />
          <p className="relative text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[0.82] tracking-[-0.07em]">
            UMA IDEIA
            <br />
            <span className="font-serif font-normal italic text-brand">mais clara</span>
          </p>
          <p className="absolute bottom-5 right-5 text-xs text-muted">
            Carrossel principal · página 1
          </p>
        </div>
        <div className="space-y-2" aria-label="Lista de versões">
          {versionRows.map((item) => (
            <div
              key={item.version}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-3 ${
                item.current
                  ? 'border-brand/45 bg-brand-soft'
                  : item.approved
                    ? 'border-approval/30 bg-approval-soft'
                    : 'border-line bg-surface-secondary'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.version}</p>
                <p className="truncate text-xs text-muted">{item.label}</p>
              </div>
              {item.current ? (
                <VersionBadge current>Atual</VersionBadge>
              ) : item.approved ? (
                <VersionBadge approved>Aprovada</VersionBadge>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ApprovalPreview() {
  return (
    <div
      role="group"
      aria-label="Registro da aprovação da versão quatro por Marina, acompanhado dos três eventos mais recentes."
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="text-sm font-semibold">Decisão da revisão</span>
        <StatusBadge status="approved" />
      </div>
      <div className="grid min-h-[25rem] gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(16rem,1.05fr)] lg:items-center">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-lg border border-approval/30 bg-approval-soft text-approval">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="heading-md mt-6">Versão 4 aprovada</p>
          <p className="mt-3 max-w-sm leading-relaxed text-secondary">
            A decisão final fica conectada à pessoa, ao horário e à versão escolhida.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <VersionBadge approved>v4 aprovada</VersionBadge>
            <span className="text-muted">Marina · hoje, 14:16</span>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-background/55 p-4">
          <p className="eyebrow">Últimos eventos</p>
          <ol className="mt-5 space-y-1">
            {approvalEvents.map((event) => (
              <li key={event.label} className="grid grid-cols-[1rem_1fr] gap-3 py-2">
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    event.approved ? 'bg-approval' : 'border border-line-strong bg-surface-elevated'
                  }`}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold">{event.label}</p>
                  <p className="mt-1 text-xs text-muted">{event.meta}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

export function FeaturePreview({ featureId }: FeaturePreviewProps) {
  if (featureId === 'documents') return <ImageReviewDemo />
  if (featureId === 'video') return <VideoReviewDemo />
  if (featureId === 'versions') return <VersionsPreview />
  return <ApprovalPreview />
}
