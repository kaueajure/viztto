import { MessageSquare, Pause, Volume2 } from 'lucide-react'
import { VersionBadge } from '@/components/feedback/FeedbackComponents'

export function VideoReviewDemo() {
  return (
    <div
      role="group"
      aria-label="Revisão de vídeo com comentário relacionado ao segundo trinta e oito."
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft"
    >
      <div className="relative min-h-[19rem] overflow-hidden bg-background p-6 surface-grid sm:min-h-[21rem]">
        <div
          className="absolute -right-10 top-10 h-52 w-52 rounded-full border-[32px] border-line"
          aria-hidden
        />
        <div
          className="absolute bottom-8 left-8 h-24 w-[56%] rotate-[-5deg] bg-brand-soft"
          aria-hidden
        />
        <p className="relative max-w-sm text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[0.82] tracking-[-0.07em]">
          MOVIMENTO
          <br />
          <span className="font-serif font-normal italic text-brand">com direção</span>
        </p>
        <div className="absolute bottom-4 left-4 rounded-sm bg-background/90 px-2 py-1 text-xs">
          00:38 / 01:24
        </div>
      </div>
      <div className="border-t border-line bg-surface-elevated p-4">
        <div className="flex items-center gap-3">
          <Pause className="h-4 w-4 text-brand" />
          <Volume2 className="h-4 w-4 text-secondary" />
          <div className="relative h-2 flex-1 rounded-full bg-surface-secondary">
            <span className="absolute inset-y-0 left-0 w-[45%] rounded-full bg-brand" />
            <span className="absolute left-[45%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-revision" />
          </div>
          <VersionBadge current>v4</VersionBadge>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-md border border-revision/30 bg-revision-soft p-3 text-sm">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-revision" />
          <div>
            <p className="font-semibold text-ink">00:38 · Rafael</p>
            <p className="mt-1 text-secondary">A transição pode começar dois segundos antes.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
