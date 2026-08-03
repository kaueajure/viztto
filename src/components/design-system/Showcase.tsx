import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function ShowcaseSection({
  id,
  index,
  title,
  note,
  children,
  className,
}: {
  id: string
  index: string
  title: string
  note?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-line py-12 md:py-16">
      <div className="grid gap-7 lg:grid-cols-12">
        <header className="lg:col-span-3">
          <p className="eyebrow text-brand">{index}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
          {note && <p className="mt-3 text-sm leading-relaxed text-secondary">{note}</p>}
        </header>
        <div className={cn('min-w-0 lg:col-span-9', className)}>{children}</div>
      </div>
    </section>
  )
}

export function Swatch({
  name,
  value,
  className,
}: {
  name: string
  value: string
  className: string
}) {
  return (
    <div className="min-w-0">
      <div className={cn('h-24 rounded-md border border-black/5', className)} />
      <p className="mt-2 text-xs font-semibold">{name}</p>
      <p className="font-mono text-[10px] text-muted">{value}</p>
    </div>
  )
}
