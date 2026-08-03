import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export function Container({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('mx-auto w-full max-w-page px-5 sm:px-7 lg:px-10', className)} {...props} />
  )
}
