import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Audience } from '@/data/audiences'

type AudienceNavigationProps = {
  items: Audience[]
  activeIndex: number
  onChange: (index: number) => void
}

export function AudienceNavigation({ items, activeIndex, onChange }: AudienceNavigationProps) {
  const focusTab = (index: number) => {
    onChange(index)
    document.getElementById(`audience-tab-${items[index].id}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Públicos do Viztto"
      className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0"
    >
      {items.map((item, index) => {
        const active = activeIndex === index
        return (
          <button
            key={item.id}
            id={`audience-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="audience-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault()
                focusTab((index + 1) % items.length)
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault()
                focusTab((index - 1 + items.length) % items.length)
              }
              if (event.key === 'Home') {
                event.preventDefault()
                focusTab(0)
              }
              if (event.key === 'End') {
                event.preventDefault()
                focusTab(items.length - 1)
              }
            }}
            className={cn(
              'group flex min-h-12 shrink-0 items-center justify-between gap-5 rounded-md border px-4 text-left text-sm font-semibold transition-colors lg:w-full',
              active
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-surface text-secondary hover:border-line-strong hover:text-ink',
            )}
          >
            {item.label}
            <ChevronRight
              className={cn(
                'hidden h-4 w-4 transition-transform lg:block',
                active && 'translate-x-1',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
