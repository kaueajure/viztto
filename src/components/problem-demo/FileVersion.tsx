import { FileImage } from 'lucide-react'
import { cn } from '@/lib/cn'

export function FileVersion({ name, emphasized = false }: { name: string; emphasized?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 rounded-md border px-3 py-2.5 text-xs shadow-soft', emphasized ? 'border-revision/60 bg-revision-soft' : 'border-line bg-surface')}>
      <FileImage className={cn('h-3.5 w-3.5 shrink-0', emphasized ? 'text-revision' : 'text-muted')} />
      <span className="truncate">{name}</span>
    </div>
  )
}
