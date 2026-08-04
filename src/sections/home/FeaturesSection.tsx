import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { FeaturePreview } from '@/components/features/FeaturePreview'
import { Container } from '@/components/layout/Container'
import { mainFeatures } from '@/data/features'

const ease = [0.22, 1, 0.36, 1] as const

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const idPrefix = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeFeature = mainFeatures[activeIndex]

  const selectAndFocus = (index: number) => {
    const nextIndex = (index + mainFeatures.length) % mainFeatures.length
    setActiveIndex(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      selectAndFocus(index + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      selectAndFocus(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      selectAndFocus(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      selectAndFocus(mainFeatures.length - 1)
    }
  }

  return (
    <section
      id="recursos"
      aria-labelledby="features-title"
      className="scroll-mt-24 border-t border-line-subtle py-20 md:py-28"
    >
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <div>
            <p className="eyebrow">Tudo que a revisão precisa</p>
            <h2 id="features-title" className="heading-lg mt-4">
              Feedback claro em{' '}
              <span className="font-serif font-normal text-brand">qualquer formato.</span>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-secondary lg:justify-self-end">
            Centralize comentários, versões e decisões sem obrigar sua equipe a adaptar o processo a
            ferramentas diferentes.
          </p>
        </div>

        <div className="mt-14 hidden gap-8 md:grid md:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
          <div>
            <div
              role="tablist"
              aria-label="Recursos principais do Viztto"
              aria-orientation="vertical"
            >
              {mainFeatures.map((feature, index) => {
                const selected = index === activeIndex
                const tabId = `${idPrefix}-feature-tab-${index}`
                const panelId = `${idPrefix}-feature-panel`

                return (
                  <button
                    key={feature.id}
                    ref={(element) => {
                      tabRefs.current[index] = element
                    }}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={`group grid w-full grid-cols-[2.25rem_1fr] gap-3 border-l-2 px-4 py-4 text-left transition-colors ${
                      selected
                        ? 'border-brand bg-brand-soft text-ink'
                        : 'border-line text-secondary hover:border-line-strong hover:bg-surface/60 hover:text-ink'
                    }`}
                  >
                    <span
                      className={`font-serif text-lg ${selected ? 'text-brand' : 'text-muted'}`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold">{feature.navLabel}</span>
                  </button>
                )
              })}
            </div>

            <div className="min-h-60 px-4 pt-8">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{activeFeature.meta}</p>
              <h3 className="heading-sm mt-3">{activeFeature.title}</h3>
              <p className="mt-4 leading-relaxed text-secondary">{activeFeature.description}</p>
            </div>
          </div>

          <div
            id={`${idPrefix}-feature-panel`}
            role="tabpanel"
            aria-labelledby={`${idPrefix}-feature-tab-${activeIndex}`}
            className="min-h-[34rem]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFeature.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
              >
                <FeaturePreview featureId={activeFeature.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 space-y-3 md:hidden">
          {mainFeatures.map((feature, index) => {
            const expanded = index === activeIndex
            const panelId = `${idPrefix}-mobile-feature-${index}`

            return (
              <article
                key={feature.id}
                className="overflow-hidden rounded-lg border border-line bg-surface"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setActiveIndex(index)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`font-serif text-lg ${expanded ? 'text-brand' : 'text-muted'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-semibold">{feature.navLabel}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <div className="border-t border-line px-4 py-5">
                  <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    {feature.description}
                  </p>
                </div>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      id={panelId}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease }}
                      className="border-t border-line p-3"
                    >
                      <FeaturePreview featureId={feature.id} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
