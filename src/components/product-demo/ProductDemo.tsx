import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { DemoCanvas } from './DemoCanvas'
import { DemoFooter } from './DemoFooter'
import { DemoSidebar } from './DemoSidebar'
import { DemoToolbar } from './DemoToolbar'

export function ProductDemo({ restartSignal = 0 }: { restartSignal?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const reducedMotion = Boolean(prefersReducedMotion)
  const visibleStep = reducedMotion ? 6 : step

  useEffect(() => {
    if (reducedMotion) return
    setStep(0)
    let current = 0
    let timeout = 0
    const advance = () => {
      timeout = window.setTimeout(
        () => {
          current = (current + 1) % 7
          setStep(current)
          advance()
        },
        current === 6 ? 2200 : 1050,
      )
    }
    advance()
    return () => window.clearTimeout(timeout)
  }, [reducedMotion, restartSignal])

  return (
    <motion.section
      id="demonstracao"
      aria-label="Demonstração do fluxo de revisão do Viztto"
      className="relative scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.24 }}
    >
      <div aria-hidden="true" className="absolute inset-x-12 top-0 h-px bg-brand/45" />
      <DemoToolbar approved={visibleStep >= 6} currentVersion={visibleStep >= 5 ? 3 : 2} />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_240px]">
        <DemoCanvas step={visibleStep} reducedMotion={reducedMotion} />
        <DemoSidebar highlighted={visibleStep >= 4} />
      </div>
      <DemoFooter />
    </motion.section>
  )
}
