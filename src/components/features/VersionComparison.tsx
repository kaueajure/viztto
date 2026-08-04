import { RotateCcw } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { VersionBadge } from '@/components/feedback/FeedbackComponents'
import { IconButton } from '@/components/ui/Button'

export function VersionComparison({
  beforeImage,
  afterImage,
  beforeLabel = 'v3',
  afterLabel = 'v4',
}: {
  beforeImage?: string
  afterImage?: string
  beforeLabel?: string
  afterLabel?: string
} = {}) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const frame = useRef<HTMLDivElement>(null)

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

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-raised sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <VersionBadge>{beforeLabel}</VersionBadge>
          <VersionBadge current>{afterLabel}</VersionBadge>
        </div>
        <IconButton
          label="Redefinir comparação para cinquenta por cento"
          onClick={() => setPosition(50)}
        >
          <RotateCcw className="h-4 w-4" />
        </IconButton>
      </div>
      <div
        ref={frame}
        className="relative min-h-[24rem] touch-none select-none overflow-hidden rounded-lg border border-line bg-background sm:min-h-[32rem]"
        onPointerDown={onPointerDown}
        onPointerMove={(event) => dragging && updateFromPointer(event.clientX)}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onLostPointerCapture={() => setDragging(false)}
      >
        {beforeImage ? (
          <img
            src={beforeImage}
            alt="Versão anterior"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <VersionArtwork version="v3" />
        )}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          {afterImage ? (
            <img
              src={afterImage}
              alt="Versão atual"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <VersionArtwork version="v4" />
          )}
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Posição do divisor de comparação"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`Divisor em ${Math.round(position)}%. ${beforeLabel} ocupa a área à esquerda e ${afterLabel} ocupa a área à direita.`}
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
          {beforeLabel} · anterior
        </span>
        <span className="absolute right-3 top-3 z-10 rounded-sm bg-brand px-2 py-1 text-xs font-semibold text-brand-contrast">
          {afterLabel} · atual
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Arraste o divisor ou use as setas, Home, End, Page Up e Page Down.
      </p>
    </div>
  )
}

function VersionArtwork({ version }: { version: 'v3' | 'v4' }) {
  const current = version === 'v4'
  return (
    <div
      className={`absolute inset-0 overflow-hidden p-6 text-ink sm:p-10 ${current ? 'bg-surface-elevated' : 'bg-surface-secondary'}`}
      aria-hidden
    >
      <div
        className={`absolute h-56 w-56 rounded-full border-[28px] sm:h-64 sm:w-64 ${
          current ? '-right-20 -top-16 border-brand/25' : '-right-14 top-4 border-line-strong/55'
        }`}
      />
      <div
        className={`absolute h-52 w-64 rounded-lg border ${
          current
            ? '-bottom-10 left-[8%] rotate-[-4deg] border-brand/30 bg-brand-soft'
            : '-bottom-6 left-[3%] rotate-3 border-line bg-surface'
        }`}
      />
      <div
        className={`absolute max-w-lg ${current ? 'left-[10%] top-[19%]' : 'left-[7%] top-[24%]'}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          Campanha de agosto
        </span>
        <p
          className={`mt-3 text-[clamp(3rem,9vw,7.2rem)] font-semibold tracking-[-0.07em] ${
            current ? 'leading-[0.78] text-ink' : 'leading-[0.84] text-secondary'
          }`}
        >
          CLAREZA
          <br />
          <span
            className={`font-serif font-normal italic ${current ? 'text-brand' : 'text-muted'}`}
          >
            {current ? 'em foco' : 'em processo'}
          </span>
        </p>
      </div>
      <div
        className={`absolute bottom-7 max-w-52 rounded-md border px-3 py-2 text-xs ${
          current
            ? 'right-7 border-brand/35 bg-brand-soft text-right text-ink'
            : 'left-6 border-revision/30 bg-revision-soft text-left text-secondary sm:left-10'
        }`}
      >
        {current
          ? 'Hierarquia ajustada e contraste ampliado.'
          : 'Primeira composição enviada para revisão.'}
      </div>
      <span
        className={`absolute left-6 top-1/2 h-1 w-12 rounded-full sm:left-10 ${current ? 'bg-brand' : 'bg-revision'}`}
      />
    </div>
  )
}
