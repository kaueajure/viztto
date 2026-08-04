import { Container } from '@/components/layout/Container'
import { Accordion } from '@/components/ui/Interactive'
import { faqItems } from '@/data/faq'

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-20 md:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="eyebrow">Antes de abrir a primeira revisão</p>
            <h2 id="faq-title" className="heading-lg mt-4">
              Perguntas antes{' '}
              <span className="font-serif font-normal text-accent">de começar.</span>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-secondary">
              Respostas diretas sobre a experiência planejada para equipes e clientes.
            </p>
          </div>
          <Accordion items={faqItems} />
        </div>
      </Container>
    </section>
  )
}
