import { RotateCcw } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { VersionBadge } from '@/components/feedback/FeedbackComponents'
import { IconButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/FormControls'
import { cn } from '@/lib/cn'

export type VersaoComparavel = {
  id: string
  label: string
  imageUrl?: string
  tipo?: 'imagem' | 'video' | 'pdf' | string
}

export function VersionComparison({
  versions,
  beforeId,
  afterId,
  onBeforeId,
  onAfterId,
  mode = 'side-by-side',
  beforeImage,
  afterImage,
  beforeLabel = 'v3',
  afterLabel = 'v4',
}: {
  versions?: VersaoComparavel[]
  beforeId?: string | null
  afterId?: string | null
  onBeforeId?: (id: string) => void
  onAfterId?: (id: string) => void
  mode?: 'side-by-side' | 'slider'
  beforeImage?: string
  afterImage?: string
  beforeLabel?: string
  afterLabel?: string
} = {}) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const frame = useRef<HTMLDivElement>(null)

  const before =
    versions?.find((item) => item.id === beforeId) ??
    (beforeImage ? { id: 'before', label: beforeLabel, imageUrl: beforeImage } : undefined)
  const after =
    versions?.find((item) => item.id === afterId) ??
    (afterImage ? { id: 'after', label: afterLabel, imageUrl: afterImage } : undefined)

  const updateFromPointer = (clientX: number) => {
    const bounds = frame.current?.getBoundingClientRect()
    if (!bounds) return
    setPosition(Math.min(100, Math.max(0, ((clientX - bounds.left) / bounds.width) * 100)))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX)
  }

  const releasePointer = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const changes: Record<string, number> = {
      ArrowLeft: -2,
      ArrowDown: -2,
      ArrowRight: 2,
      ArrowUp: 2,
      PageDown: -10,
      PageUp: 10,
    }
    if (event.key in changes) {
      event.preventDefault()
      setPosition((value) => Math.min(100, Math.max(0, value + changes[event.key])))
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setPosition(event.key === 'Home' ? 0 : 100)
    }
  }

  const renderMedia = (item?: VersaoComparavel, fallbackLabel = 'versão') => {
    if (!item?.imageUrl) {
      return (
        <div className="grid h-full min-h-[18rem] place-items-center bg-surface-secondary text-sm text-muted">
          Sem mídia para {fallbackLabel}
        </div>
      )
    }
    if (item.tipo === 'video') {
      return (
        <video
          src={item.imageUrl}
          controls
          className="h-full max-h-[70vh] w-full object-contain"
        />
      )
    }
    if (item.tipo === 'pdf') {
      return (
        <iframe
          title={item.label}
          src={item.imageUrl}
          className="h-[70vh] w-full rounded-md border border-line bg-background"
        />
      )
    }
    return (
      <img src={item.imageUrl} alt={item.label} className="h-full max-h-[70vh] w-full object-contain" />
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-raised sm:p-5">
      {versions && onBeforeId && onAfterId ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Select
            label="Versão anterior"
            value={beforeId ?? ''}
            onChange={(e) => onBeforeId(e.target.value)}
          >
            {versions.map((item) => (
              <option key={`before-${item.id}`} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select
            label="Versão nova"
            value={afterId ?? ''}
            onChange={(e) => onAfterId(e.target.value)}
          >
            {versions.map((item) => (
              <option key={`after-${item.id}`} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <VersionBadge>{before?.label ?? beforeLabel}</VersionBadge>
            <VersionBadge current>{after?.label ?? afterLabel}</VersionBadge>
          </div>
          {mode === 'slider' && (
            <IconButton
              label="Redefinir comparação para cinquenta por cento"
              onClick={() => setPosition(50)}
            >
              <RotateCcw className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      )}

      {mode === 'side-by-side' || (before?.tipo && before.tipo !== 'imagem') || (after?.tipo && after.tipo !== 'imagem') ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-line bg-background">
            <p className="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {before?.label ?? beforeLabel}
            </p>
            <div className={cn('min-h-[18rem]', !before?.imageUrl && 'grid place-items-center')}>
              {renderMedia(before, beforeLabel)}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-background">
            <p className="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {after?.label ?? afterLabel}
            </p>
            <div className={cn('min-h-[18rem]', !after?.imageUrl && 'grid place-items-center')}>
              {renderMedia(after, afterLabel)}
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={frame}
          className="relative min-h-[24rem] touch-none select-none overflow-hidden rounded-lg border border-line bg-background sm:min-h-[32rem]"
          onPointerDown={onPointerDown}
          onPointerMove={(event) => dragging && updateFromPointer(event.clientX)}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={() => setDragging(false)}
        >
          {before?.imageUrl ? (
            <img
              src={before.imageUrl}
              alt="Versão anterior"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : null}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            {after?.imageUrl ? (
              <img
                src={after.imageUrl}
                alt="Versão atual"
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : null}
          </div>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Posição do divisor de comparação"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            onKeyDown={onKeyDown}
            className="version-comparison-slider absolute inset-y-0 z-20 w-0.5 bg-brand focus-visible:outline-none"
            style={{ left: `${position}%` }}
          >
            <span
              className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-brand bg-surface-elevated text-brand shadow-raised"
              aria-hidden
            >
              ↔
            </span>
          </div>
          <span className="absolute left-3 top-3 z-10 rounded-sm bg-background/90 px-2 py-1 text-xs font-semibold">
            {before?.label ?? beforeLabel}
          </span>
          <span className="absolute right-3 top-3 z-10 rounded-sm bg-brand px-2 py-1 text-xs font-semibold text-brand-contrast">
            {after?.label ?? afterLabel}
          </span>
        </div>
      )}
    </div>
  )
}
