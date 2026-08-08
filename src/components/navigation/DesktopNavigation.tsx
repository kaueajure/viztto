import { Link } from 'react-router'
import { commercialLinks } from './navigationData'
import { HashLink } from './HashLink'
import { cn } from '@/lib/cn'

export function DesktopNavigation({ activePath }: { activePath: string }) {
  return (
    <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
      {commercialLinks.map((link) => {
        const isActive = activePath === link.to || activePath.startsWith(`${link.to}/`)
        const className = cn(
          'rounded-sm px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-secondary hover:text-ink',
          isActive && 'bg-brand-soft text-brand',
        )
        return link.to.includes('#') ? (
          <HashLink key={link.to} to={link.to} aria-current={isActive ? 'location' : undefined} className={className}>
            {link.label}
          </HashLink>
        ) : (
          <Link key={link.to} to={link.to} aria-current={isActive ? 'page' : undefined} className={className}>
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
