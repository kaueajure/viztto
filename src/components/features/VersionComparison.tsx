import { RotateCcw } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { VersionBadge } from '@/components/feedback/FeedbackComponents'
import { IconButton } from '@/components/ui/Button'

export function VersionComparison() {
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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const changes: Record<string, number> = {
      ArrowLeft: -2,
      ArrowDown: -2,
      ArrowRight: 2,
      ArrowUp: 2,
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
          <VersionBadge>v3</VersionBadge>
          <VersionBadge current>v4</VersionBadge>
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
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <VersionArtwork version="v3" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <VersionArtwork version="v4" />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Posição do divisor de comparação"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)}% da versão 3 visível`}
          onKeyDown={onKeyDown}
          className="absolute inset-y-0 z-20 w-px bg-ink focus-visible:outline-none"
          style={{ left: `${position}%` }}
        >
          <span
            className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-brand text-brand-contrast shadow-raised"
            aria-hidden
          >
            ↔
          </span>
        </div>
        <span className="absolute left-3 top-3 z-10 rounded-sm bg-background/90 px-2 py-1 text-xs font-semibold">
          v3 · anterior
        </span>
        <span className="absolute right-3 top-3 z-10 rounded-sm bg-brand px-2 py-1 text-xs font-semibold text-brand-contrast">
          v4 · atual
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Arraste o divisor ou use as setas do teclado.
      </p>
    </div>
  )
}

function VersionArtwork({ version }: { version: 'v3' | 'v4' }) {
  const current = version === 'v4'
  return (
    <div
      className={`absolute inset-0 overflow-hidden p-6 sm:p-10 ${current ? 'bg-accent text-background' : 'bg-revision text-background'}`}
      aria-hidden
    >
      <div
        className={`absolute -right-20 -top-20 h-72 w-72 rounded-full border-[52px] ${current ? 'border-brand' : 'border-warning'}`}
      />
      <div
        className={`absolute -bottom-24 -left-16 h-72 w-72 rotate-12 border-[44px] ${current ? 'border-background' : 'border-accent'}`}
      />
      <p className="relative max-w-lg text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.76] tracking-[-0.075em]">
        CLAREZA
        <br />
        <span
          className={`font-serif font-normal italic ${current ? 'text-brand' : 'text-warning'}`}
        >
          {current ? 'em foco' : 'em processo'}
        </span>
      </p>
      <div className="absolute bottom-7 right-7 max-w-48 text-right text-xs font-semibold">
        {current
          ? 'Hierarquia ajustada e contraste ampliado.'
          : 'Primeira composição enviada para revisão.'}
      </div>
    </div>
  )
}
