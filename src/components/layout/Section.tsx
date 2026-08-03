import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export function Section({ className, ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={cn('py-16 md:py-24', className)} {...props} />
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-8 max-w-3xl md:mb-12">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="heading-md">{title}</h2>
      {description && <p className="mt-4 max-w-2xl text-secondary">{description}</p>}
    </div>
  )
}
