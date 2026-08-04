import { Check } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import type { PricingPlan } from '@/data/pricing'
import { cn } from '@/lib/cn'

export function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-xl border bg-surface p-6 shadow-soft sm:p-7',
        plan.recommended ? 'border-brand' : 'border-line',
      )}
    >
      {plan.recommended && (
        <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-contrast">
          Recomendado
        </span>
      )}
      <p className="text-sm font-semibold text-secondary">{plan.name}</p>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{plan.price}</p>
      <p className="mt-3 min-h-12 text-sm leading-relaxed text-secondary">{plan.audience}</p>
      <div className="my-6 h-px bg-line" />
      <ul className="grid gap-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {feature}
          </li>
        ))}
      </ul>
      <LinkButton
        to="/criar-conta"
        variant={plan.recommended ? 'primary' : 'secondary'}
        className="mt-8 w-full"
      >
        {plan.cta}
      </LinkButton>
    </article>
  )
}
