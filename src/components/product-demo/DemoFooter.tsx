import { ChevronLeft, ChevronRight, Eye, MessageSquare, Minus, Plus } from 'lucide-react'
import { productDemo, demoPhaseContent, demoPhaseOrder, type DemoPhase } from '@/data/productDemo'
import { cn } from '@/lib/cn'

const controlClass =
  'grid h-7 w-7 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-secondary hover:text-ink'

export function DemoFooter({ phase, reducedMotion }: { phase: DemoPhase; reducedMotion: boolean }) {
  const currentPhase = phase === 'resetting' ? 'approved' : phase
  const activeIndex = demoPhaseOrder.indexOf(currentPhase)
  const version = currentPhase === 'new-version' || currentPhase === 'approved' ? 3 : 2

  return (
    <footer className="grid gap-2 border-t border-line bg-surface px-3 py-2 text-[10px] text-muted sm:px-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="hidden items-center gap-1 sm:flex" aria-label="Controle de zoom">
        <button type="button" aria-label="Diminuir zoom" className={controlClass}>
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-8 text-center">82%</span>
        <button type="button" aria-label="Aumentar zoom" className={controlClass}>
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div
        className="flex min-w-0 items-center justify-center gap-2"
        aria-label={`Fase atual: ${demoPhaseContent[currentPhase].label}`}
      >
        <div className="flex items-center gap-1" aria-hidden="true">
          {demoPhaseOrder.map((item, index) => (
            <span
              key={item}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                index <= activeIndex ? 'bg-brand' : 'bg-line-strong',
              )}
            />
          ))}
        </div>
        <span className="truncate font-semibold text-secondary">
          {demoPhaseContent[currentPhase].label}
        </span>
        {reducedMotion && <span className="sr-only">Demonstração estática</span>}
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="hidden items-center gap-1 sm:flex" aria-label="Navegação entre versões">
          <button type="button" aria-label="Versão anterior" className={controlClass}>
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span>{`Versão ${version} de 3`}</span>
          <button type="button" aria-label="Próxima versão" className={controlClass}>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {productDemo.commentCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3 text-approval" />3 visualizando
        </span>
      </div>
    </footer>
  )
}
