import { MessageSquarePlus, Move } from 'lucide-react'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ReviewPin } from '@/components/review/ReviewPin'
import { cn } from '@/lib/cn'
import type { ReviewComment } from '@/types/domain'

export function ImageReviewCanvas({
  imageUrl,
  alt = 'Material em revisão',
  comments,
  selectedId,
  creationMode,
  zoom,
  draftPosition,
  onPoint,
  onSelect,
}: {
  imageUrl: string
  alt?: string
  comments: ReviewComment[]
  selectedId: string | null
  creationMode: boolean
  zoom: number
  draftPosition?: { x: number; y: number } | null
  onPoint: (position: { x: number; y: number }) => void
  onSelect: (commentId: string) => void
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<
    { pointerId: number; x: number; y: number; originX: number; originY: number } | undefined
  >(undefined)

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (creationMode || zoom <= 100 || event.button !== 0) return
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    setPan({
      x: drag.current.originX + event.clientX - drag.current.x,
      y: drag.current.originY + event.clientY - drag.current.y,
    })
  }
  const stopPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = undefined
  }

  return (
    <div
      className={cn(
        'relative grid min-h-[24rem] flex-1 touch-none place-items-center overflow-hidden bg-[#090d12] p-4 sm:min-h-[32rem]',
        creationMode ? 'cursor-crosshair' : zoom > 100 ? 'cursor-grab active:cursor-grabbing' : '',
      )}
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={stopPan}
      onPointerCancel={stopPan}
      onLostPointerCapture={stopPan}
    >
      <div
        className="relative w-full max-w-5xl select-none shadow-raised"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})` }}
        onClick={(event) => {
          if (!creationMode) return
          const rect = event.currentTarget.getBoundingClientRect()
          onPoint({
            x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
          })
        }}
        onKeyDown={(event) => {
          if (creationMode && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onPoint({ x: 0.5, y: 0.5 })
          }
        }}
        role={creationMode ? 'button' : 'group'}
        tabIndex={creationMode ? 0 : -1}
        aria-label={
          creationMode
            ? 'Imagem em modo de comentário. Pressione Enter para marcar o centro.'
            : 'Material em revisão com comentários posicionados.'
        }
      >
        {imageUrl ? (
          <img src={imageUrl} alt={alt} draggable={false} className="block h-auto w-full" />
        ) : (
          <div className="grid min-h-[20rem] place-items-center px-6 text-center text-sm text-muted">
            Sem pré-visualização
          </div>
        )}
        {comments.map((comment, index) => (
          <ReviewPin
            key={comment.id}
            number={index + 1}
            comment={comment}
            active={selectedId === comment.id}
            onSelect={() => onSelect(comment.id)}
          />
        ))}
        {draftPosition && (
          <span
            aria-hidden
            className="absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-brand text-xs font-bold text-brand-contrast ring-4 ring-brand/25"
            style={{ left: `${draftPosition.x * 100}%`, top: `${draftPosition.y * 100}%` }}
          >
            +
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-line bg-surface-elevated/95 px-3 py-2 text-xs text-secondary">
        {creationMode ? (
          <MessageSquarePlus className="h-4 w-4 text-brand" />
        ) : (
          <Move className="h-4 w-4" />
        )}
        {creationMode
          ? 'Clique na imagem para posicionar o comentário'
          : 'Amplie para movimentar a imagem'}
      </div>
    </div>
  )
}
