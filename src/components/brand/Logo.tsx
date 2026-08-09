import { cn } from '@/lib/cn'

const LOGO_MARK = '/brand/logo-mark.png'

export function BrandSymbol({
  className = '',
  variant = 'bare',
}: {
  className?: string
  variant?: 'framed' | 'bare' | 'monochrome'
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden',
        variant === 'framed' && 'rounded-md border border-line bg-ink',
        variant === 'bare' && 'rounded-md',
        variant === 'monochrome' && 'rounded-md opacity-90 grayscale',
        className,
      )}
    >
      <img
        src={LOGO_MARK}
        alt=""
        width={36}
        height={36}
        decoding="async"
        className="h-full w-full object-contain"
      />
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
      <BrandSymbol
        className={compact ? 'h-8 w-8' : 'h-9 w-9'}
        variant={monochrome ? 'monochrome' : 'bare'}
      />
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
