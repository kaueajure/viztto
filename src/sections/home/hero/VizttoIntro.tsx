import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type IntroPhase = 'draw' | 'mark' | 'wordmark' | 'hold' | 'exit'

/** Apresentação um pouco mais respirada (~2.1s até o Hero). */
const ms = {
  draw: 720,
  markSettle: 140,
  wordmark: 380,
  hold: 420,
  exit: 480,
} as const

type VizttoIntroProps = {
  onRevealHero: () => void
  onComplete: () => void
}

export function VizttoIntro({ onRevealHero, onComplete }: VizttoIntroProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const [phase, setPhase] = useState<IntroPhase>('draw')
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const wait = (t: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, t)
      })

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    ;(async () => {
      if (reducedMotion) {
        onRevealHero()
        onComplete()
        return
      }

      setPhase('draw')
      await wait(ms.draw)
      if (cancelled) return
      setPhase('mark')
      await wait(ms.markSettle)
      if (cancelled) return
      setPhase('wordmark')
      await wait(ms.wordmark)
      if (cancelled) return
      setPhase('hold')
      await wait(ms.hold)
      if (cancelled) return

      setPhase('exit')
      setExiting(true)
      onRevealHero()
      await wait(ms.exit)
      if (!cancelled) onComplete()
    })()

    return () => {
      cancelled = true
      document.body.style.overflow = previousOverflow
    }
  }, [onComplete, onRevealHero, reducedMotion])

  if (reducedMotion || typeof document === 'undefined') return null

  const showWordmark = phase === 'wordmark' || phase === 'hold' || phase === 'exit'
  const checkSettled = phase !== 'draw'

  return createPortal(
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200] grid place-items-center bg-background"
      initial={false}
      animate={exiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 surface-grid opacity-30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[min(90%,28rem)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--brand-primary)_12%,transparent),transparent_70%)]"
      />

      <motion.div
        className="relative flex flex-col items-center gap-5"
        animate={exiting ? { scale: 0.97, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative text-brand"
          initial={false}
          animate={checkSettled ? { scale: [0.97, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-2xl sm:h-24 sm:w-24"
          />
          <svg
            viewBox="0 0 48 48"
            className="relative h-[4.75rem] w-[4.75rem] sm:h-[6rem] sm:w-[6rem]"
            fill="none"
          >
            <motion.path
              d="M10 18 L20 34"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M18 34 L40 10"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.42, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        </motion.div>

        <motion.p
          initial={false}
          animate={{
            opacity: showWordmark ? 1 : 0,
            y: showWordmark ? 0 : 8,
            filter: showWordmark ? 'blur(0px)' : 'blur(6px)',
            scale: showWordmark ? 1 : 0.98,
          }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="text-[1.75rem] font-semibold tracking-[-0.075em] text-ink sm:text-[2rem]"
        >
          viz
          <span className="relative">
            tt
            <span className="absolute -top-[1px] left-[3px] h-[2px] w-[14px] rotate-[-7deg] rounded bg-brand" />
          </span>
          o
        </motion.p>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
