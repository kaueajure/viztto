import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { StepNavigation } from '@/components/how-it-works/StepNavigation'
import { StepPreview } from '@/components/how-it-works/StepPreview'
import { Container } from '@/components/layout/Container'
import { howItWorksSteps } from '@/data/howItWorks'

export function HowItWorksSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const active = howItWorksSteps[activeIndex]

  return (
    <section
      id="como-funciona"
      aria-labelledby="flow-title"
      className="scroll-mt-24 border-y border-line-subtle bg-surface-secondary/35 py-20 md:py-28"
    >
      <Container>
        <div className="max-w-3xl">
          <p className="eyebrow">Um fluxo simples do início ao aprovado</p>
          <h2 id="flow-title" className="heading-lg mt-4">
            Da primeira versão à{' '}
            <span className="font-serif font-normal text-brand">aprovação final.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
            Envie o material, compartilhe com o cliente, organize as alterações e registre a decisão
            final sem sair do mesmo espaço.
          </p>
        </div>

        <div className="mt-12 hidden gap-10 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(32rem,1.2fr)] xl:gap-16">
          <StepNavigation
            steps={howItWorksSteps}
            activeIndex={activeIndex}
            onChange={setActiveIndex}
          />
          <div className="sticky top-24 self-start">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                id="flow-step-panel"
                role="tabpanel"
                aria-labelledby={`flow-tab-${active.id}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <StepPreview step={active.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-12 grid min-w-0 gap-12 lg:hidden">
          {howItWorksSteps.map((step) => (
            <article key={step.id} aria-labelledby={`mobile-flow-${step.id}`} className="min-w-0">
              <div className="mb-5 grid grid-cols-[2.75rem_1fr] gap-3">
                <span className="font-serif text-xl text-brand">{step.number}</span>
                <div>
                  <h3 id={`mobile-flow-${step.id}`} className="text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-secondary">{step.description}</p>
                </div>
              </div>
              <StepPreview step={step.id} />
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
