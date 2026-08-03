import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { AudienceNavigation } from '@/components/audience/AudienceNavigation'
import { AudiencePreview } from '@/components/audience/AudiencePreview'
import { Container } from '@/components/layout/Container'
import { audiences } from '@/data/audiences'

export function AudienceSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const active = audiences[activeIndex]

  return (
    <section id="publicos" aria-labelledby="audience-title" className="scroll-mt-24 py-20 md:py-28">
      <Container>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <div>
            <p className="eyebrow">Feito para quem cria e precisa aprovar</p>
            <h2 id="audience-title" className="heading-lg mt-4">
              Um fluxo flexível para diferentes{' '}
              <span className="font-serif font-normal text-accent">equipes criativas.</span>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-secondary lg:justify-self-end">
            O Viztto adapta a revisão ao tipo de material, à equipe e à relação com cada cliente.
          </p>
        </div>

        <div className="mt-10 md:hidden">
          <label htmlFor="audience-select" className="mb-2 block text-sm font-semibold">
            Escolha seu perfil
          </label>
          <select
            id="audience-select"
            value={active.id}
            onChange={(event) =>
              setActiveIndex(audiences.findIndex((item) => item.id === event.target.value))
            }
            className="min-h-12 w-full rounded-md border border-line bg-surface px-3 text-ink"
          >
            {audiences.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-10 grid gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="hidden md:block">
            <AudienceNavigation
              items={audiences}
              activeIndex={activeIndex}
              onChange={setActiveIndex}
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              id="audience-panel"
              role="tabpanel"
              aria-labelledby={`audience-tab-${active.id}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid gap-8 rounded-xl border border-line bg-surface p-5 shadow-soft sm:p-7 xl:grid-cols-[minmax(0,0.78fr)_minmax(25rem,1.22fr)] xl:items-center xl:p-9"
            >
              <div>
                <p className="text-sm font-semibold text-brand">{active.label}</p>
                <h3 className="heading-md mt-3">{active.title}</h3>
                <p className="mt-4 leading-relaxed text-secondary">{active.description}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {active.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-brand">
                        <Check className="h-3 w-3" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
              <AudiencePreview audience={active.id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  )
}
