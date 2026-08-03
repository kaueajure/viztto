import { Link, NavLink } from 'react-router-dom'
import { commercialLinks } from './navigationData'
import { cn } from '@/lib/cn'

export function DesktopNavigation() {
  return (
    <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
      {commercialLinks.map((link) =>
        link.to.includes('#') ? (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-sm px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-secondary hover:text-ink"
          >
            {link.label}
          </Link>
        ) : (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'rounded-sm px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-secondary hover:text-ink',
                isActive && 'text-brand',
              )
            }
          >
            {link.label}
          </NavLink>
        ),
      )}
    </nav>
  )
}
