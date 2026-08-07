import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PricingCard } from '@/components/pricing/PricingCard'
import { LinkButton } from '@/components/ui/Button'
import { pricingDisclaimer, pricingPlans } from '@/data/pricing'

export function PricingSection() {
  return (
    <section
      id="precos"
      aria-labelledby="pricing-title"
      className="scroll-mt-24 border-y border-line-subtle bg-surface-secondary/35 py-20 md:py-28"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Planos que acompanham sua operação</p>
          <h2 id="pricing-title" className="heading-lg mt-4">
            Comece pequeno e evolua{' '}
            <span className="font-serif font-normal text-brand">com sua equipe.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
            Escolha o plano de acordo com a quantidade de projetos, clientes e pessoas envolvidas no
            processo.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-5 rounded-lg border border-line bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Precisa apresentar o portal totalmente com a sua marca?</p>
            <p className="mt-1 text-sm text-secondary">
              Converse com a equipe sobre uma experiência white-label.
            </p>
          </div>
          <LinkButton to="/contato" variant="outline">
            Falar sobre white-label <ArrowUpRight className="h-4 w-4" />
          </LinkButton>
        </div>
        <p className="mt-5 text-center text-xs text-muted">{pricingDisclaimer}</p>
      </Container>
    </section>
  )
}
