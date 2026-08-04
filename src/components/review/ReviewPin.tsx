import { cn } from '@/lib/cn'
import type { ReviewComment } from '@/types/domain'

export function ReviewPin({
  number,
  comment,
  active,
  onSelect,
}: {
  number: number
  comment: ReviewComment
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`Comentário ${number}, ${comment.status === 'open' ? 'aberto' : 'resolvido'}, criado por ${comment.authorName}`}
      aria-pressed={active}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      className={cn(
        'absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-bold shadow-soft transition-transform hover:scale-110 focus-visible:scale-110',
        active
          ? 'border-background bg-brand text-brand-contrast ring-4 ring-brand/30'
          : comment.status === 'resolved'
            ? 'border-background bg-approval text-brand-contrast'
            : 'border-background bg-revision text-background',
      )}
      style={{ left: `${comment.x * 100}%`, top: `${comment.y * 100}%` }}
    >
      {number}
    </button>
  )
}
