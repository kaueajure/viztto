import { cn } from '@/lib/cn'

export function BrandSymbol({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-elevated text-brand',
        className,
      )}
    >
      <span className="absolute left-[7px] top-[8px] h-4 w-[3px] rotate-[-28deg] rounded-full bg-brand" />
      <span className="absolute right-[7px] top-[8px] h-4 w-[3px] rotate-[28deg] rounded-full bg-brand" />
      <span className="absolute left-1/2 top-[20px] h-2 w-2 -translate-x-1/2 rounded-full border-2 border-brand" />
    </span>
  )
}

export function Logo({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {compact && <BrandSymbol className="h-8 w-8" />}
      <span className="relative text-[27px] font-semibold tracking-[-0.075em]">
        viz
        <span className="relative">
          tt
          <span className="absolute -top-[1px] left-[3px] h-[2px] w-[13px] rotate-[-7deg] rounded bg-brand" />
        </span>
        o
      </span>
    </span>
  )
}
