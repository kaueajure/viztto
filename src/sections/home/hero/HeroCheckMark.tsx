import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

/** Check geométrico inspirado no símbolo Viztto (dois traços do V/visto). */
export function HeroCheckMark({
  className,
  draw = false,
  reducedMotion = false,
  layoutId,
}: {
  className?: string
  draw?: boolean
  reducedMotion?: boolean
  layoutId?: string
}) {
  const duration = reducedMotion || !draw ? 0 : 0.42

  return (
    <motion.span
      layoutId={layoutId}
      className={cn('inline-flex items-center justify-center text-brand', className)}
      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.7 }}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" aria-hidden="true">
        <motion.path
          d="M10 18 L20 34"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          initial={draw && !reducedMotion ? { pathLength: 0, opacity: 0.35 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: duration * 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M18 34 L40 10"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          initial={draw && !reducedMotion ? { pathLength: 0, opacity: 0.35 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: duration * 0.62,
            delay: reducedMotion || !draw ? 0 : duration * 0.28,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </svg>
    </motion.span>
  )
}
