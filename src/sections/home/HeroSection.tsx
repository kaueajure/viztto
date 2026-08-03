import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { ProductDemo } from '@/components/product-demo/ProductDemo'
import { Container } from '@/components/layout/Container'
import { Button, LinkButton } from '@/components/ui/Button'

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()
  const [restartSignal, setRestartSignal] = useState(0)
  const reducedMotion = Boolean(prefersReducedMotion)

  const showDemo = () => {
    setRestartSignal((value) => value + 1)
    document.getElementById('demonstracao')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }

  const entrance = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b border-line-subtle"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 surface-grid opacity-35" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[7%] top-24 hidden h-20 w-px bg-line-subtle lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[calc(7%-5px)] top-[170px] hidden h-2.5 w-2.5 rounded-full border border-brand/50 lg:block" />
      <Container className="relative py-14 sm:py-16 lg:py-20 xl:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:gap-10 xl:gap-14">
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: reducedMotion ? 0 : 0.08 }}
            className="max-w-2xl"
          >
            <motion.div variants={entrance} transition={{ duration: 0.35 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary shadow-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                Revisão e aprovação criativa
              </span>
            </motion.div>
            <motion.h1
              id="hero-title"
              variants={entrance}
              transition={{ duration: 0.42 }}
              className="mt-6 max-w-[720px] text-[clamp(3.25rem,8.5vw,6.9rem)] font-semibold leading-[0.84] tracking-[-0.068em]"
            >
              Todo <span className="font-serif font-normal italic text-brand">feedback</span> no{' '}
              <span className="relative inline-block whitespace-nowrap">
                lugar certo.
                <span aria-hidden="true" className="absolute -bottom-2 left-1 h-[3px] w-[62%] -rotate-1 rounded-full bg-revision" />
              </span>
            </motion.h1>
            <motion.p variants={entrance} transition={{ duration: 0.42 }} className="mt-7 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
              Revise artes, vídeos, PDFs e páginas com comentários diretamente sobre o material.
              Organize versões e receba aprovações sem depender de mensagens espalhadas.
            </motion.p>
            <motion.div variants={entrance} transition={{ duration: 0.42 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/criar-conta" className="w-full sm:w-auto">
                Começar gratuitamente <ArrowUpRight className="h-4 w-4" />
              </LinkButton>
              <Button variant="outline" onClick={showDemo} className="w-full sm:w-auto">
                Ver como funciona <ArrowDownRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.p variants={entrance} transition={{ duration: 0.42 }} className="mt-4 text-xs leading-relaxed text-muted">
              Sem cartão de crédito <span aria-hidden="true">·</span> Seus clientes não precisam
              criar conta
            </motion.p>
          </motion.div>

          <div className="relative min-w-0 lg:-mr-4 xl:-mr-8">
            <div aria-hidden="true" className="absolute -inset-5 -z-10 rounded-[32px] border border-line-subtle opacity-65" />
            <div aria-hidden="true" className="absolute -right-4 top-8 -z-10 h-40 w-40 rounded-full bg-brand/[0.035] blur-2xl" />
            <ProductDemo restartSignal={restartSignal} />
          </div>
        </div>
      </Container>
    </section>
  )
}
