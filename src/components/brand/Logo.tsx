import { cn } from '@/lib/cn'

export function BrandSymbol({
  className = '',
  variant = 'framed',
}: {
  className?: string
  variant?: 'framed' | 'bare' | 'monochrome'
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center text-brand',
        variant === 'framed' && 'overflow-hidden rounded-md border border-line bg-surface-elevated',
        variant === 'monochrome' && 'text-current',
        className,
      )}
    >
      <svg viewBox="0 0 36 36" className="h-full w-full" fill="none">
        <path
          d="M9.5 9.5 16.5 24 18 27l1.5-3L26.5 9.5"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="18"
          cy="27"
          r="2.1"
          fill={variant === 'monochrome' ? 'currentColor' : 'var(--revision)'}
        />
      </svg>
    </span>
  )
}

export function Logo({
  compact = false,
  className = '',
  monochrome = false,
}: {
  compact?: boolean
  className?: string
  monochrome?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {compact && (
        <BrandSymbol className="h-8 w-8" variant={monochrome ? 'monochrome' : 'framed'} />
      )}
      <span className="relative text-[27px] font-semibold tracking-[-0.075em]">
        viz
        <span className="relative">
          tt
          <span
            className={cn(
              'absolute -top-[1px] left-[3px] h-[2px] w-[13px] rotate-[-7deg] rounded',
              monochrome ? 'bg-current' : 'bg-brand',
            )}
          />
        </span>
        o
      </span>
    </span>
  )
}
