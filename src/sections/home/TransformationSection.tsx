import { ArrowDown } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { ScatteredFeedback } from '@/components/problem-demo/ScatteredFeedback'
import { OrganizedWorkspace } from '@/components/problem-demo/OrganizedWorkspace'
import { Container } from '@/components/layout/Container'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/cn'

export function TransformationSection() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const reducedMotion = Boolean(useReducedMotion())

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !stage.current) return
    let cancelled = false
    const media = gsap.matchMedia()
    const buildTimeline = (pin: boolean) => {
      const context = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>('[data-chaos-item]')
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: stage.current,
            start: 'top 88px',
            scrub: 0.7,
            pin,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            end: pin ? '+=980' : 'bottom 20%',
          },
        })
        timeline
          .to('[data-connections]', { opacity: 1, duration: 0.7 })
          .to(
            items,
            {
              x: (_, element) => Number((element as HTMLElement).dataset.shiftX ?? 0),
              y: (_, element) => Number((element as HTMLElement).dataset.shiftY ?? 0),
              scale: 0.86,
              opacity: 0.06,
              stagger: 0.035,
              duration: 1.1,
            },
            '>',
          )
          .to('[data-connections]', { opacity: 0, duration: 0.4 }, '<0.35')
          .to('[data-organized]', { opacity: 1, scale: 1, duration: 1.15 }, '<0.15')
          .to('[data-result]', { opacity: 1, y: 0, duration: 0.65 }, '>-0.25')
        return () => timeline.kill()
      }, root)
      return () => context.revert()
    }
    media.add('(min-width: 1024px) and (min-height: 700px)', () => buildTimeline(true))
    media.add('(min-width: 1024px) and (max-height: 699px)', () => buildTimeline(false))
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    return () => {
      cancelled = true
      media.revert()
    }
  }, [reducedMotion])

  return (
    <section
      ref={root}
      aria-label="Transformação do feedback espalhado em um fluxo organizado"
      className="overflow-hidden pb-20 md:pb-28"
    >
      <Container>
        <div
          ref={stage}
          role="group"
          aria-label="Mensagens, arquivos e comentários espalhados sendo organizados dentro de uma revisão do Viztto"
          className="relative rounded-xl border border-line-subtle bg-background p-3 lg:min-h-[650px] lg:p-5"
        >
          <div className="relative z-10 lg:absolute lg:inset-5">
            <ScatteredFeedback />
          </div>
          <svg
            data-connections
            aria-hidden="true"
            viewBox="0 0 1200 620"
            className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full opacity-0 lg:block"
          >
            <path
              d="M180 110 C360 170 430 230 600 310"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
            <path
              d="M1010 105 C850 150 770 235 600 310"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
            <path
              d="M210 520 C360 470 460 390 600 310"
              fill="none"
              stroke="var(--brand-primary)"
              strokeOpacity=".45"
              strokeWidth="1"
            />
            <path
              d="M1020 360 C850 355 760 330 600 310"
              fill="none"
              stroke="var(--revision)"
              strokeOpacity=".4"
              strokeWidth="1"
            />
          </svg>

          <div className="my-6 grid place-items-center text-muted lg:hidden" aria-hidden="true">
            <ArrowDown className="h-5 w-5" />
          </div>
          <div
            data-organized
            className={cn(
              'relative z-30 mt-4 lg:absolute lg:inset-x-[6%] lg:top-1/2 lg:mt-0 lg:-translate-y-1/2',
              reducedMotion ? 'lg:opacity-100' : 'lg:scale-[.96] lg:opacity-0',
            )}
          >
            <OrganizedWorkspace />
          </div>
          <p
            data-result
            className={cn(
              'relative z-40 mx-auto mt-6 max-w-2xl text-center text-sm font-semibold text-brand lg:absolute lg:bottom-6 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2',
              reducedMotion ? 'lg:opacity-100' : 'lg:translate-y-2 lg:opacity-0',
            )}
          >
            Cada comentário conectado ao material, à versão e à decisão certa.
          </p>
        </div>
      </Container>
    </section>
  )
}
