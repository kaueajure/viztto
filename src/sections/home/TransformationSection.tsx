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
  const viewportFrame = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const reducedMotion = Boolean(useReducedMotion())

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !viewportFrame.current || !stage.current) return
    let cancelled = false
    const media = gsap.matchMedia()

    const buildTimeline = (pin: boolean, distance: number, scrub: number) => {
      const context = gsap.context(() => {
        const groups = gsap.utils.toArray<HTMLElement>('[data-chaos-group]')
        const setWillChange = (value: string) =>
          groups.forEach((group) => {
            group.style.willChange = value
          })
        const driver = { progress: 0 }
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: pin ? 'top top+=80' : 'top 78%',
            end: pin ? `+=${distance}` : 'bottom 28%',
            scrub,
            pin: pin ? viewportFrame.current : false,
            anticipatePin: pin ? 1 : 0,
            invalidateOnRefresh: true,
            onEnter: () => setWillChange('transform, opacity'),
            onEnterBack: () => setWillChange('transform, opacity'),
            onLeave: () => setWillChange('auto'),
            onLeaveBack: () => setWillChange('auto'),
          },
        })

        gsap.set(groups, { x: 0, y: 0, scale: 1, opacity: 1 })
        gsap.set('[data-connections]', { opacity: 0 })
        gsap.set('[data-organized]', { opacity: 0, scale: 0.985 })
        gsap.set('[data-result]', { opacity: 0, y: 8 })

        timeline
          .to(driver, { progress: 1, duration: 1 }, 0)
          .to('[data-connections]', { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.2)
          .to(
            groups,
            {
              x: (_, element) => Number((element as HTMLElement).dataset.shiftX ?? 0) * 0.35,
              y: (_, element) => Number((element as HTMLElement).dataset.shiftY ?? 0) * 0.35,
              scale: 0.97,
              opacity: 0.84,
              duration: 0.2,
            },
            0.2,
          )
          .to(
            groups,
            {
              x: (_, element) => Number((element as HTMLElement).dataset.shiftX ?? 0),
              y: (_, element) => Number((element as HTMLElement).dataset.shiftY ?? 0),
              scale: 0.91,
              opacity: 0.1,
              duration: 0.32,
              ease: 'power1.inOut',
            },
            0.4,
          )
          .to('[data-connections]', { opacity: 0, duration: 0.14 }, 0.58)
          .to(groups, { opacity: 0, duration: 0.14 }, 0.72)
          .to(
            '[data-organized]',
            { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' },
            0.72,
          )
          .to('[data-result]', { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.84)

        return () => {
          setWillChange('auto')
          timeline.kill()
        }
      }, root)
      return () => context.revert()
    }

    media.add('(min-width: 1200px) and (min-height: 800px)', () => buildTimeline(true, 720, 0.35))
    media.add('(min-width: 1200px) and (min-height: 700px) and (max-height: 799px)', () =>
      buildTimeline(true, 620, 0.28),
    )
    media.add(
      '(min-width: 1024px) and (max-width: 1199px), (min-width: 1024px) and (max-height: 699px)',
      () => buildTimeline(false, 0, 0.22),
    )

    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(() => {
      if (!cancelled) refresh()
    })
    window.addEventListener('orientationchange', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('orientationchange', refresh)
      media.revert()
    }
  }, [reducedMotion])

  return (
    <section
      ref={root}
      aria-label="Transformação do feedback espalhado em um fluxo organizado"
      className="overflow-hidden pb-20 md:pb-28"
    >
      <div
        ref={viewportFrame}
        className="min-[1200px]:flex min-[1200px]:min-h-[calc(100svh-5rem)] min-[1200px]:items-center min-[1200px]:justify-center"
      >
        <Container className="w-full max-w-[1240px] min-[1200px]:py-5">
          <div
            ref={stage}
            role="group"
            aria-label="Mensagens, arquivos e comentários espalhados sendo organizados dentro de uma revisão do Viztto"
            className="relative mx-auto w-full max-w-[1200px] rounded-xl border border-line-subtle bg-background p-3 lg:min-h-[620px] lg:p-4"
          >
            <div className="relative z-10 lg:absolute lg:inset-4">
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
                'relative z-30 mt-4 lg:absolute lg:inset-x-[4%] lg:top-1/2 lg:mt-0 lg:-translate-y-1/2',
                reducedMotion ? 'lg:opacity-100' : 'lg:scale-[.985] lg:opacity-0',
              )}
            >
              <OrganizedWorkspace />
            </div>
            <p
              data-result
              className={cn(
                'relative z-40 mx-auto mt-6 max-w-2xl text-center text-sm font-semibold text-brand lg:absolute lg:bottom-4 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2',
                reducedMotion ? 'lg:opacity-100' : 'lg:translate-y-2 lg:opacity-0',
              )}
            >
              Cada comentário conectado ao material, à versão e à decisão certa.
            </p>
          </div>
        </Container>
      </div>
    </section>
  )
}
