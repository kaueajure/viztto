import { cn } from '@/lib/cn'
import type { HowItWorksStep } from '@/data/howItWorks'

type StepNavigationProps = {
  steps: HowItWorksStep[]
  activeIndex: number
  onChange: (index: number) => void
}

export function StepNavigation({ steps, activeIndex, onChange }: StepNavigationProps) {
  const moveFocus = (index: number) => {
    onChange(index)
    document.getElementById(`flow-tab-${steps[index].id}`)?.focus()
  }

  return (
    <div role="tablist" aria-label="Etapas do fluxo do Viztto" className="grid gap-2">
      {steps.map((step, index) => {
        const active = activeIndex === index
        return (
          <button
            key={step.id}
            id={`flow-tab-${step.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="flow-step-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                event.preventDefault()
                moveFocus((index + 1) % steps.length)
              }
              if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                event.preventDefault()
                moveFocus((index - 1 + steps.length) % steps.length)
              }
              if (event.key === 'Home') {
                event.preventDefault()
                moveFocus(0)
              }
              if (event.key === 'End') {
                event.preventDefault()
                moveFocus(steps.length - 1)
              }
            }}
            className={cn(
              'group grid grid-cols-[3.25rem_1fr] gap-3 rounded-lg border px-4 py-4 text-left transition-colors',
              active
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-transparent text-secondary hover:border-line hover:bg-surface',
            )}
          >
            <span
              className={cn(
                'font-serif text-xl transition-colors',
                active ? 'text-brand' : 'text-muted group-hover:text-secondary',
              )}
            >
              {step.number}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{step.title}</span>
              <span className="mt-1 block text-sm leading-relaxed">{step.description}</span>
            </span>
            <span className="col-span-2 h-px overflow-hidden rounded-full bg-line" aria-hidden>
              <span
                className={cn(
                  'block h-full origin-left bg-brand transition-transform duration-300',
                  active ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
