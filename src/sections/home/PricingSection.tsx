import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PricingCard } from '@/components/pricing/PricingCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { assinaturasApi } from '@/services/api/assinaturasApi'

function PricingSkeleton() {
  return (
    <div
      className="h-[30rem] animate-pulse rounded-xl border border-line bg-surface p-7"
      aria-hidden
    >
      <div className="h-4 w-24 rounded bg-line-subtle" />
      <div className="mt-6 h-9 w-32 rounded bg-line-subtle" />
      <div className="mt-5 h-4 w-full rounded bg-line-subtle" />
      <div className="mt-2 h-4 w-4/5 rounded bg-line-subtle" />
      <div className="my-7 h-px bg-line" />
      <div className="grid gap-4">
        <div className="h-4 w-5/6 rounded bg-line-subtle" />
        <div className="h-4 w-3/4 rounded bg-line-subtle" />
        <div className="h-4 w-4/5 rounded bg-line-subtle" />
      </div>
    </div>
  )
}

export function PricingSection() {
  const planos = useQuery({
    queryKey: ['planos-publicos'],
    queryFn: assinaturasApi.listarPlanosPublicos,
    staleTime: 0,
    refetchOnMount: 'always',
  })

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
        {planos.isPending ? (
          <div
            className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            role="status"
            aria-label="Carregando planos"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <PricingSkeleton key={index} />
            ))}
          </div>
        ) : planos.isError ? (
          <div className="mx-auto mt-14 max-w-xl rounded-xl border border-line bg-surface p-7 text-center">
            <p className="font-semibold">Não foi possível carregar os planos agora.</p>
            <p className="mt-2 text-sm text-secondary">
              Tente novamente para consultar os preços e benefícios atualizados.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              loading={planos.isFetching}
              onClick={() => void planos.refetch()}
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </div>
        ) : planos.data.length > 0 ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {planos.data.map((plan) => (
              <PricingCard key={plan.codigo} plan={plan} recommended={plan.codigo === 'studio'} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-xl rounded-xl border border-line bg-surface p-7 text-center">
            <p className="font-semibold">Novos planos serão anunciados em breve.</p>
            <p className="mt-2 text-sm text-secondary">
              Fale com a equipe para encontrar a melhor opção para sua operação.
            </p>
          </div>
        )}
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
        <p className="mt-5 text-center text-xs text-muted">
          Valores mensais. Consulte as condições completas no momento da assinatura.
        </p>
      </Container>
    </section>
  )
}
