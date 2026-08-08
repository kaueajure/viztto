import { motion } from 'motion/react'
import { Avatar } from '@/components/ui/DataDisplay'
import { heroDemo } from './heroSequence'
import { cn } from '@/lib/cn'

export function HeroCommentCard({
  visible,
  reducedMotion,
  highlighted = false,
  onHoverChange,
}: {
  visible: boolean
  reducedMotion: boolean
  highlighted?: boolean
  onHoverChange?: (value: boolean) => void
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-auto absolute right-1 top-5 z-20 w-[min(12.75rem,68%)] sm:right-2 sm:top-8 lg:-right-1"
      style={{ transform: 'translateZ(60px)' }}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 10,
        scale: visible ? 1 : 0.94,
      }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
    >
      <div
        className={cn(
          'rounded-lg border bg-surface p-3 shadow-raised transition-colors',
          highlighted ? 'border-brand/50' : 'border-line',
        )}
      >
        <div className="flex items-start gap-2.5">
          <Avatar name={heroDemo.author} color="bg-revision text-background" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">{heroDemo.authorFirst}</p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">{heroDemo.comment}</p>
          </div>
        </div>
      </div>
      <svg
        aria-hidden="true"
        className="absolute -left-6 top-7 hidden h-7 w-7 text-brand/70 sm:block"
        viewBox="0 0 32 32"
        fill="none"
      >
        <motion.path
          d="M30 8 C18 8 10 14 4 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          initial={false}
          animate={{ opacity: visible ? 1 : 0, pathLength: visible ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, delay: reducedMotion ? 0 : 0.08 }}
        />
      </svg>
    </motion.div>
  )
}

export function HeroVersionBadgeLayer({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute left-2 top-4 z-20 sm:left-3"
      style={{ transform: 'translateZ(28px)' }}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 8,
        scale: visible ? 1 : 0.95,
      }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2 shadow-soft">
        <span className="rounded-sm border border-brand bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
          V3
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Última versão
        </span>
      </div>
    </motion.div>
  )
}

export function HeroTimeline({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const steps: Array<{ label: string; active: boolean; approval?: boolean }> = [
    { label: 'V1', active: false },
    { label: 'V2', active: false },
    { label: 'V3', active: true },
    { label: '✓', active: true, approval: true },
  ]

  return (
    <motion.div
      aria-hidden="true"
      className="mt-4 flex items-center justify-center gap-2"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
      transition={{ duration: reducedMotion ? 0 : 0.28 }}
    >
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-sm border px-2 py-1 text-[10px] font-semibold',
              step.approval
                ? 'border-approval/40 bg-approval-soft text-approval'
                : step.active
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line bg-surface text-muted',
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="h-px w-4 bg-line-strong sm:w-6" />
          ) : null}
        </div>
      ))}
    </motion.div>
  )
}
