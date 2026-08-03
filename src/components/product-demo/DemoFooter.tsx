import { ChevronLeft, ChevronRight, Eye, MessageSquare, Minus, Plus } from 'lucide-react'
import { productDemo } from '@/data/productDemo'

const controlClass =
  'grid h-7 w-7 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-secondary hover:text-ink'

export function DemoFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-3 py-2 text-[10px] text-muted sm:px-4">
      <div className="flex items-center gap-1" aria-label="Controle de zoom">
        <button type="button" aria-label="Diminuir zoom" className={controlClass}>
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-8 text-center">82%</span>
        <button type="button" aria-label="Aumentar zoom" className={controlClass}>
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-1" aria-label="Navegação entre versões">
        <button type="button" aria-label="Versão anterior" className={controlClass}>
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span>Versão 3 de 3</span>
        <button type="button" aria-label="Próxima versão" className={controlClass}>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-3">
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
