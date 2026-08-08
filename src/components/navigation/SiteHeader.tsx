import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { DesktopNavigation } from './DesktopNavigation'
import { MobileNavigation } from './MobileNavigation'
import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  const closeMenu = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) requestAnimationFrame(() => menuButton.current?.focus())
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
      if (event.key === 'Tab') {
        const menu = document.getElementById('mobile-navigation')
        const focusable = Array.from(
          menu?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
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
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('#mobile-navigation a[href]')?.focus(),
    )
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [closeMenu, open])

  useEffect(() => {
    if (open) closeMenu(false)
    // Closing on location changes must not steal focus from the new page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200',
        scrolled
          ? 'border-line bg-background/95 shadow-soft backdrop-blur-md'
          : 'border-transparent bg-background/85',
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" aria-label="Viztto — página inicial" onClick={() => open && closeMenu(false)}>
          <Logo />
        </Link>
        <DesktopNavigation activePath={location.pathname} />
        <div className="hidden items-center gap-2 md:flex">
          <LinkButton to="/entrar" variant="ghost">
            Entrar
          </LinkButton>
          <LinkButton to="/criar-conta" className="min-h-10 px-4">
            Começar grátis
          </LinkButton>
        </div>
        <button
          ref={menuButton}
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => (open ? closeMenu() : setOpen(true))}
          className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface text-ink transition-colors hover:border-line-strong hover:bg-surface-secondary md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>
      <MobileNavigation open={open} onClose={closeMenu} />
    </header>
  )
}
