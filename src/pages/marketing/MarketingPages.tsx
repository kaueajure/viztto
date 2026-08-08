import { ArrowUpRight, Mail, MapPin, MessageCircle } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { LinkButton } from '@/components/ui/Button'
import { AudienceSection } from '@/sections/home/AudienceSection'
import { ClientExperienceSection } from '@/sections/home/ClientExperienceSection'
import { FeaturesSection } from '@/sections/home/FeaturesSection'
import { FinalCtaSection } from '@/sections/home/FinalCtaSection'
import { HowItWorksSection } from '@/sections/home/HowItWorksSection'
import { PricingSection } from '@/sections/home/PricingSection'
import { SupportedFormatsSection } from '@/sections/home/SupportedFormatsSection'
import { VersionComparisonSection } from '@/sections/home/VersionComparisonSection'

function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  highlight?: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <Section className="border-b border-line-subtle pb-16 pt-16 md:pb-20 md:pt-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="heading-lg mt-4">
            {title}{' '}
            {highlight ? (
              <span className="font-serif font-normal text-brand">{highlight}</span>
            ) : null}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
            {description}
          </p>
          {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
        </div>
      </Container>
    </Section>
  )
}

export function ProdutoPage() {
  return (
    <>
      <PageHero
        eyebrow="Produto"
        title="Revisão criativa com"
        highlight="contexto."
        description="Centralize materiais, comentários, versões e aprovações em um fluxo único para equipe e cliente."
        actions={
          <>
            <LinkButton to="/criar-conta">
              Começar gratuitamente <ArrowUpRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton to="/recursos" variant="outline">
              Ver recursos
            </LinkButton>
          </>
        }
      />
      <HowItWorksSection />
      <VersionComparisonSection />
      <ClientExperienceSection />
      <FinalCtaSection />
    </>
  )
}

export function RecursosPage() {
  return (
    <>
      <PageHero
        eyebrow="Recursos"
        title="Tudo que a revisão"
        highlight="precisa."
        description="Comentários no ponto certo, histórico de versões, portal do cliente e formatos que o trabalho criativo já usa."
        actions={
          <>
            <LinkButton to="/criar-conta">
              Testar no plano gratuito <ArrowUpRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton to="/precos" variant="outline">
              Ver planos
            </LinkButton>
          </>
        }
      />
      <FeaturesSection />
      <SupportedFormatsSection />
      <AudienceSection />
      <FinalCtaSection />
    </>
  )
}

export function PrecosPage() {
  return (
    <>
      <PageHero
        eyebrow="Planos"
        title="Um plano para cada"
        highlight="operação criativa."
        description="Comece no gratuito e evolua conforme a quantidade de projetos, clientes e pessoas envolvidas no processo."
        actions={
          <LinkButton to="/criar-conta">
            Começar gratuitamente <ArrowUpRight className="h-4 w-4" />
          </LinkButton>
        }
      />
      <PricingSection />
      <FinalCtaSection />
    </>
  )
}

export function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar sobre"
        highlight="revisão criativa."
        description="Fale com a equipe sobre planos, white-label, dúvidas comerciais ou suporte da conta."
      />
      <Section className="pb-20 md:pb-28">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            <a
              href="mailto:contato@viztto.site"
              className="rounded-xl border border-line bg-surface p-6 transition-colors hover:border-brand/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-lg font-semibold">E-mail</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                contato@viztto.site — comercial, suporte e white-label.
              </p>
            </a>
            <div className="rounded-xl border border-line bg-surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-lg font-semibold">Perguntas frequentes</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Cancelamento, portal e planos já estão respondidos na home.
              </p>
              <LinkButton to="/#faq" variant="ghost" className="mt-4 px-0">
                Abrir FAQ <ArrowUpRight className="h-4 w-4" />
              </LinkButton>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-lg font-semibold">Conta e acesso</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Já usa o Viztto? Entre no app para gerenciar workspace e plano.
              </p>
              <LinkButton to="/entrar" variant="ghost" className="mt-4 px-0">
                Entrar <ArrowUpRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
