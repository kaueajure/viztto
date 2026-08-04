import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <span tabIndex={0}>{children}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-max -translate-x-1/2 rounded-sm bg-ink px-2.5 py-1.5 text-xs text-background opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const els = Array.from(
          panel.current.querySelectorAll<HTMLElement>(
            'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'))
        if (!els.length) return
        const first = els[0],
          last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button')?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-end bg-overlay p-0 sm:place-items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-lg rounded-t-xl border border-line bg-surface-elevated p-5 shadow-raised sm:rounded-xl sm:p-7"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-semibold">
                {title}
              </h2>
              <IconButton label="Fechar modal" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Dropdown({ label, items }: { label: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-line-strong hover:bg-surface-secondary"
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-52 rounded-md border border-line bg-surface-elevated p-1.5 shadow-soft"
          >
            {items.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setOpen(false)}
                className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-surface-secondary"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Tabs({ items }: { items: Array<{ label: string; content: ReactNode }> }) {
  const [active, setActive] = useState(0)
  const id = useId()
  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((item, i) => (
          <button
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-controls={`${id}-${i}`}
            key={item.label}
            onClick={() => setActive(i)}
            className={cn(
              'relative whitespace-nowrap px-4 py-3 text-sm font-medium',
              active === i ? 'text-brand' : 'text-secondary',
            )}
          >
            {item.label}
            {active === i && (
              <motion.span
                layoutId={`${id}-indicator`}
                className="absolute inset-x-2 bottom-0 h-0.5 bg-brand"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          role="tabpanel"
          id={`${id}-${active}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="py-5 text-sm text-secondary"
        >
          {items[active].content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function Accordion({ items }: { items: Array<{ title: string; content: string }> }) {
  const [active, setActive] = useState<number | null>(0)
  const id = useId()
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <div key={item.title}>
          <button
            id={`${id}-trigger-${i}`}
            type="button"
            aria-expanded={active === i}
            aria-controls={`${id}-panel-${i}`}
            onClick={() => setActive(active === i ? null : i)}
            className="flex w-full items-center justify-between py-4 text-left font-medium"
          >
            {item.title}
            <ChevronDown className={cn('h-4 w-4 transition', active === i && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {active === i && (
              <motion.p
                id={`${id}-panel-${i}`}
                role="region"
                aria-labelledby={`${id}-trigger-${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pb-4 text-sm text-secondary"
              >
                {item.content}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export function Toast({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-5 left-5 right-5 z-50 flex items-center gap-3 rounded-md border border-line-strong bg-surface-elevated p-4 text-ink shadow-raised sm:left-auto sm:w-96"
        >
          <CheckCircle2 className="h-5 w-5 text-approval" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Comentário resolvido</p>
            <p className="text-xs text-secondary">O histórico foi atualizado na versão 3.</p>
          </div>
          <button type="button" aria-label="Fechar aviso" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
