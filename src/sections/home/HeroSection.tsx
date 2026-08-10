import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Button, LinkButton } from '@/components/ui/Button'
import { HeroProductScene } from '@/sections/home/hero/HeroProductScene'
import { useHomeIntroOptional } from '@/sections/home/hero/homeIntroContext'
import { VizttoIntro } from '@/sections/home/hero/VizttoIntro'

export function HeroSection() {
  const prefersReducedMotion = Boolean(useReducedMotion())
  const homeIntro = useHomeIntroOptional()
  const playIntro = !prefersReducedMotion
  const [introMounted, setIntroMounted] = useState(playIntro)
  const [heroRevealed, setHeroRevealed] = useState(!playIntro)

  useEffect(() => {
    if (!playIntro) homeIntro?.setHomeIntroActive(false)
  }, [homeIntro, playIntro])

  const revealHero = useCallback(() => {
    setHeroRevealed(true)
    homeIntro?.setHomeIntroActive(false)
  }, [homeIntro])

  const finishIntro = useCallback(() => {
    setIntroMounted(false)
  }, [])

  const showDemo = () => {
    document.getElementById('demonstracao')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }

  const entrance = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate overflow-x-clip border-b border-line-subtle"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 surface-grid opacity-30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[min(90%,42rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--brand-primary)_10%,transparent),transparent_68%)]"
      />

      <Container className="relative py-14 sm:py-16 lg:py-20 xl:py-24">
        {introMounted ? (
          <VizttoIntro onRevealHero={revealHero} onComplete={finishIntro} />
        ) : null}

        <motion.div
          initial={false}
          animate={
            heroRevealed
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: prefersReducedMotion ? 1 : 0.985 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.12 : 0.36,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={heroRevealed ? undefined : 'pointer-events-none'}
        >
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-8 xl:gap-12">
            <motion.div
              initial={false}
              animate={heroRevealed ? 'visible' : 'hidden'}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: prefersReducedMotion ? 0 : 0.07,
                    delayChildren: prefersReducedMotion ? 0 : 0.04,
                  },
                },
              }}
              className={`relative z-10 order-1 max-w-2xl ${heroRevealed ? '' : 'pointer-events-none'}`}
            >
              <motion.div
                variants={entrance}
                transition={{ duration: prefersReducedMotion ? 0 : 0.32 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary shadow-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                  Revisão e aprovação criativa
                </span>
              </motion.div>

              <motion.h1
                id="hero-title"
                variants={entrance}
                transition={{ duration: prefersReducedMotion ? 0 : 0.36 }}
                className="mt-6 max-w-[720px] text-[clamp(3rem,8vw,6.4rem)] font-semibold leading-[0.86] tracking-[-0.068em]"
              >
                Todo <span className="font-serif font-normal italic text-brand">feedback</span> no{' '}
                <span className="relative inline-block whitespace-nowrap">
                  lugar certo.
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-1 h-[3px] w-[62%] -rotate-1 rounded-full bg-revision"
                  />
                </span>
              </motion.h1>

              <motion.p
                variants={entrance}
                transition={{ duration: prefersReducedMotion ? 0 : 0.36 }}
                className="mt-7 max-w-xl text-base leading-relaxed text-secondary sm:text-lg"
              >
                Revise imagens, vídeos e PDFs com comentários diretamente sobre o material.
                Organize versões e receba aprovações sem depender de mensagens espalhadas.
              </motion.p>

              <motion.div
                variants={entrance}
                transition={{ duration: prefersReducedMotion ? 0 : 0.36 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <LinkButton
                  to="/criar-conta"
                  className="w-full sm:w-auto"
                  tabIndex={heroRevealed ? undefined : -1}
                >
                  Começar gratuitamente <ArrowUpRight className="h-4 w-4" />
                </LinkButton>
                <Button
                  variant="outline"
                  onClick={showDemo}
                  className="w-full sm:w-auto"
                  tabIndex={heroRevealed ? undefined : -1}
                >
                  Ver como funciona <ArrowDownRight className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.p
                variants={entrance}
                transition={{ duration: prefersReducedMotion ? 0 : 0.36 }}
                className="mt-4 text-xs leading-relaxed text-muted"
              >
                Sem cartão de crédito <span aria-hidden="true">·</span> Seus clientes não precisam
                criar conta
              </motion.p>
            </motion.div>

            <div className="relative order-2 min-w-0 lg:-mr-2 xl:-mr-6">
              <HeroProductScene stage="live" />
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
