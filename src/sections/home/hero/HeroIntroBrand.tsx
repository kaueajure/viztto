import { motion } from 'motion/react'
import { HeroCheckMark } from './HeroCheckMark'
import { cn } from '@/lib/cn'

export function HeroWordmark({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <motion.p
      aria-hidden="true"
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 8,
        filter: reducedMotion ? 'blur(0px)' : visible ? 'blur(0px)' : 'blur(6px)',
        scale: visible ? 1 : 0.97,
      }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-[-0.075em] text-ink"
    >
      viz
      <span className="relative">
        tt
        <span className="absolute -top-[1px] left-[3px] h-[2px] w-[13px] rotate-[-7deg] rounded bg-brand" />
      </span>
      o
    </motion.p>
  )
}

export function HeroApprovalBadge({
  active,
  reducedMotion,
  showSharedCheck,
  emphasize = false,
  className,
}: {
  active: boolean
  reducedMotion: boolean
  showSharedCheck: boolean
  emphasize?: boolean
  className?: string
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-approval/35 bg-approval-soft px-3 py-1.5 text-xs font-semibold text-approval shadow-soft',
        className,
      )}
      animate={{
        opacity: active ? 1 : 0,
        scale: active ? (emphasize ? 1.04 : 1) : 0.94,
        y: active ? 0 : 8,
      }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="relative grid h-5 w-5 place-items-center overflow-visible">
        {showSharedCheck ? (
          <HeroCheckMark layoutId="viztto-hero-check" className="h-5 w-5 text-approval" />
        ) : (
          <HeroCheckMark className="h-4 w-4 text-approval" />
        )}
      </span>
      Aprovado pelo cliente
    </motion.div>
  )
}
