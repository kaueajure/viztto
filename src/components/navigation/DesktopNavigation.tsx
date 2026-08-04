import { commercialLinks } from './navigationData'
import { HashLink } from './HashLink'
import { cn } from '@/lib/cn'

export function DesktopNavigation({ activeSection }: { activeSection: string | null }) {
  return (
    <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
      {commercialLinks.map((link) => {
        const sectionId = link.to.split('#')[1]
        const isActive = activeSection === sectionId
        return (
          <HashLink
            key={link.to}
            to={link.to}
            aria-current={isActive ? 'location' : undefined}
            className={cn(
              'rounded-sm px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-secondary hover:text-ink',
              isActive && 'bg-brand-soft text-brand',
            )}
          >
            {link.label}
          </HashLink>
        )
      })}
    </nav>
  )
}
