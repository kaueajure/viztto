import { motion } from 'motion/react'
import { VersionBadge } from '@/components/feedback/FeedbackComponents'
import { heroDemo } from './heroSequence'
import { cn } from '@/lib/cn'

export function HeroMaterialCard({
  className,
  pinActive = false,
}: {
  className?: string
  pinActive?: boolean
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-surface shadow-raised',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {heroDemo.project}
          </p>
          <p className="truncate text-sm font-semibold text-ink">{heroDemo.material}</p>
        </div>
        <VersionBadge current>V3</VersionBadge>
      </header>

      <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary surface-grid sm:aspect-[5/4]">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[28px] border-brand/80"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -left-8 h-36 w-36 rotate-12 border-[22px] border-revision/75"
        />
        <div className="absolute left-[9%] top-[10%] text-[9px] font-semibold uppercase tracking-[0.18em] text-brand">
          Estúdio Viztto · 2026
        </div>
        <div className="absolute inset-x-[9%] top-[30%]">
          <p className="text-[clamp(1.8rem,4.5vw,2.75rem)] font-semibold leading-[0.82] tracking-[-0.06em] text-ink">
            FORMA
            <br />
            <span className="font-serif font-normal italic text-brand">em movimento</span>
          </p>
        </div>
        <div className="absolute bottom-[10%] right-[9%] max-w-28 text-right text-[9px] leading-relaxed text-secondary">
          Feedback no ponto certo vira aprovação.
        </div>

        <motion.span
          aria-hidden="true"
          className={cn(
            'absolute left-[58%] top-[38%] grid h-7 w-7 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-contrast shadow-soft',
            pinActive && 'ring-4 ring-brand/30',
          )}
          animate={{ scale: pinActive ? 1.08 : 1 }}
          transition={{ duration: 0.2 }}
        >
          1
          <span className="absolute -bottom-1 h-2 w-2 rotate-45 bg-brand" />
        </motion.span>
      </div>
    </article>
  )
}

export function HeroVersionCard({
  version,
  label,
  className,
  advanced = false,
}: {
  version: string
  label: string
  className?: string
  advanced?: boolean
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        'w-[9.5rem] overflow-hidden rounded-lg border border-line bg-surface-secondary/95 shadow-soft sm:w-44',
        className,
      )}
      animate={{ y: advanced ? -6 : 0, x: advanced ? 4 : 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, x: 4 }}
    >
      <div className="flex items-center justify-between border-b border-line/80 px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-secondary">{version}</span>
        <span className="text-[9px] text-muted">{label}</span>
      </div>
      <div className="relative h-16 overflow-hidden bg-[#12171d] sm:h-20">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border-[14px] border-brand/35" />
        <div className="absolute bottom-2 left-2 text-[9px] font-semibold tracking-[-0.04em] text-ink/70">
          FORMA
        </div>
      </div>
    </motion.div>
  )
}
