import { Check } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import type { PlanoPublico } from '@/services/api/assinaturasApi'
import { cn } from '@/lib/cn'

const formatadoresMoeda = new Map<string, Intl.NumberFormat>()

function formatarPreco(valor: string | number, moeda: string) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'Consulte'

  let formatador = formatadoresMoeda.get(moeda)
  if (!formatador) {
    try {
      formatador = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: moeda,
        maximumFractionDigits: 2,
      })
    } catch {
      return `${moeda} ${numero.toFixed(2)}`
    }
    formatadoresMoeda.set(moeda, formatador)
  }

  return formatador.format(numero)
}

export function PricingCard({
  plan,
  recommended = false,
}: {
  plan: PlanoPublico
  recommended?: boolean
}) {
  const gratuito = Number(plan.valorMensal) === 0
  const preco = formatarPreco(plan.valorMensal, plan.moeda)

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-xl border bg-surface p-6 shadow-soft sm:p-7',
        recommended ? 'border-brand' : 'border-line',
      )}
    >
      {recommended && (
        <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-contrast">
          Recomendado
        </span>
      )}
      <p className="text-sm font-semibold text-secondary">{plan.nome}</p>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
        {preco}
        {!gratuito && (
          <span className="text-base font-normal tracking-normal text-secondary">/mês</span>
        )}
      </p>
      <p className="mt-3 min-h-12 text-sm leading-relaxed text-secondary">{plan.descricao}</p>
      <div className="my-6 h-px bg-line" />
      <ul className="grid gap-3 text-sm">
        {plan.beneficios.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {feature}
          </li>
        ))}
      </ul>
      <LinkButton
        to="/criar-conta"
        variant={recommended ? 'primary' : 'secondary'}
        className="mt-8 w-full"
      >
        {gratuito ? 'Começar gratuitamente' : `Escolher ${plan.nome}`}
      </LinkButton>
    </article>
  )
}
