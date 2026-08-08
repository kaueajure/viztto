import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { DemoCanvas } from './DemoCanvas'
import { DemoFooter } from './DemoFooter'
import { DemoSidebar } from './DemoSidebar'
import { DemoToolbar } from './DemoToolbar'
import { demoPhaseContent, demoResetDuration, type DemoPhase } from '@/data/productDemo'

const nextPhase: Record<DemoPhase, DemoPhase> = {
  waiting: 'commenting',
  commenting: 'new-version',
  'new-version': 'approved',
  approved: 'resetting',
  resetting: 'waiting',
}

const phaseDuration = (phase: DemoPhase) =>
  phase === 'resetting' ? demoResetDuration : demoPhaseContent[phase].duration

export function ProductDemo({
  restartSignal = 0,
  suppressEntrance = false,
  onPhaseChange,
}: {
  restartSignal?: number
  /** Quando true, a entrada fica a cargo do wrapper (ex.: Hero 3D). */
  suppressEntrance?: boolean
  onPhaseChange?: (phase: DemoPhase) => void
}) {
  const reducedMotion = Boolean(useReducedMotion())
  const root = useRef<HTMLElement>(null)
  const inView = useInView(root, { amount: 0.15 })
  const [phase, setPhase] = useState<DemoPhase>('waiting')
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible')
  const visiblePhase: DemoPhase = reducedMotion ? 'approved' : phase

  useEffect(() => {
    onPhaseChange?.(visiblePhase)
  }, [onPhaseChange, visiblePhase])

  useEffect(() => {
    const handleVisibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    setPhase('waiting')
    if (!inView || !pageVisible) return

    let cancelled = false
    let timeout = 0
    const schedule = (current: DemoPhase) => {
      timeout = window.setTimeout(() => {
        if (cancelled) return
        const following = nextPhase[current]
        setPhase(following)
        schedule(following)
      }, phaseDuration(current))
    }
    schedule('waiting')
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [inView, pageVisible, reducedMotion, restartSignal])

  return (
    <motion.section
      ref={root}
      id="demonstracao"
      aria-label="Demonstração do fluxo de revisão do Viztto"
      className="relative scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
      initial={suppressEntrance || reducedMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: suppressEntrance || reducedMotion ? 0 : 0.55,
        delay: suppressEntrance || reducedMotion ? 0 : 0.24,
      }}
    >
      <div aria-hidden="true" className="absolute inset-x-12 top-0 h-px bg-brand/45" />
      <motion.div
        animate={{ opacity: visiblePhase === 'resetting' ? 0.42 : 1 }}
        transition={{ duration: reducedMotion ? 0 : visiblePhase === 'resetting' ? 0.45 : 0.18 }}
      >
        <DemoToolbar phase={visiblePhase} reducedMotion={reducedMotion} />
        <div className="grid xl:grid-cols-[minmax(0,1fr)_240px]">
          <DemoCanvas phase={visiblePhase} reducedMotion={reducedMotion} />
          <DemoSidebar phase={visiblePhase} reducedMotion={reducedMotion} />
        </div>
        <DemoFooter phase={visiblePhase} reducedMotion={reducedMotion} />
      </motion.div>
    </motion.section>
  )
}
