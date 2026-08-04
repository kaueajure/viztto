import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

type TooltipChildProps = { 'aria-describedby'?: string }

export function Tooltip({
  label,
  children,
}: {
  label: string
  children: ReactElement<TooltipChildProps>
}) {
  const id = useId()
  const describedBy = [children.props['aria-describedby'], id].filter(Boolean).join(' ')

  return (
    <span className="group relative inline-flex">
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span
        id={id}
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
  const titleId = useId()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'Tab' && panel.current) {
        const elements = Array.from(
          panel.current.querySelectorAll<HTMLElement>(
            'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute('disabled'))
        if (!elements.length) {
          event.preventDefault()
          panel.current.focus()
          return
        }
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button')?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-end bg-overlay p-0 sm:place-items-center sm:p-5"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="w-full max-w-lg rounded-t-xl border border-line bg-surface-elevated p-5 shadow-raised sm:rounded-xl sm:p-7"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-xl font-semibold">
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
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const menuId = useId()
  const reduceMotion = useReducedMotion()

  const openAndFocus = (index: number) => {
    setOpen(true)
    requestAnimationFrame(() => itemRefs.current[index]?.focus())
  }
  const close = (returnFocus = false) => {
    setOpen(false)
    if (returnFocus) requestAnimationFrame(() => trigger.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((item) => item === document.activeElement)
    let next = current
    if (event.key === 'ArrowDown') next = (current + 1) % items.length
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
      return
    } else return
    event.preventDefault()
    itemRefs.current[next]?.focus()
  }

  return (
    <div ref={root} className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? close() : openAndFocus(0))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openAndFocus(0)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openAndFocus(items.length - 1)
          }
        }}
        className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-line-strong hover:bg-surface-secondary"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            initial={reduceMotion ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-52 rounded-md border border-line bg-surface-elevated p-1.5 shadow-soft"
          >
            {items.map((item, index) => (
              <button
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                type="button"
                role="menuitem"
                key={item}
                onClick={() => close(true)}
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reduceMotion = useReducedMotion()

  const activate = (index: number, focus = false) => {
    setActive(index)
    if (focus) requestAnimationFrame(() => tabRefs.current[index]?.focus())
  }
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let next = active
    if (event.key === 'ArrowRight') next = (active + 1) % items.length
    else if (event.key === 'ArrowLeft') next = (active - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    activate(next, true)
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Opções de demonstração"
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {items.map((item, index) => (
          <button
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            tabIndex={active === index ? 0 : -1}
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            key={item.label}
            onClick={() => activate(index)}
            className={cn(
              'relative min-h-11 whitespace-nowrap px-4 py-3 text-sm font-medium',
              active === index ? 'text-brand' : 'text-secondary',
            )}
          >
            {item.label}
            {active === index && (
              <motion.span
                layoutId={`${id}-indicator`}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="absolute inset-x-2 bottom-0 h-0.5 bg-brand"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          role="tabpanel"
          id={`${id}-panel-${active}`}
          aria-labelledby={`${id}-tab-${active}`}
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
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
  const reduceMotion = useReducedMotion()

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const isOpen = active === index
        const panel = (
          <p
            id={`${id}-panel-${index}`}
            role="region"
            aria-labelledby={`${id}-trigger-${index}`}
            className="pb-4 text-sm text-secondary"
          >
            {item.content}
          </p>
        )
        return (
          <div key={item.title}>
            <button
              id={`${id}-trigger-${index}`}
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${id}-panel-${index}`}
              onClick={() => setActive(isOpen ? null : index)}
              className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-medium"
            >
              {item.title}
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition', isOpen && 'rotate-180')} />
            </button>
            {reduceMotion ? (
              isOpen ? (
                panel
              ) : null
            ) : (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {panel}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function Toast({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
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
