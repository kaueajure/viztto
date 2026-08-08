import { useEffect, type ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  isDarkPortalColor,
  normalizePortalBrandColor,
  portalBrandStyle,
  type PortalBrand,
} from '@/lib/portalBrand'

export type { PortalBrand } from '@/lib/portalBrand'

function initials(companyName: string) {
  return (
    companyName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'P'
  )
}

function faviconDataUrl(companyName: string, color: string) {
  const text =
    initials(companyName)
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 1) || 'P'
  const foreground = isDarkPortalColor(color) ? '#ffffff' : '#10150b'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><text x="32" y="41" text-anchor="middle" font-family="Arial,sans-serif" font-size="31" font-weight="700" fill="${foreground}">${text}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function usePortalDocumentBrand({
  brand,
  companyName,
  pageTitle,
}: {
  brand?: PortalBrand
  companyName: string
  pageTitle: string
}) {
  useEffect(() => {
    const previousTitle = document.title
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousThemeColor = themeColor?.content
    const favicons = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]'))
    const previousFavicons = favicons.map((item) => item.href)
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = description?.content
    const color = normalizePortalBrandColor(brand?.corPrincipal)

    document.title = `${pageTitle} · ${brand?.whiteLabel ? companyName : 'Viztto'}`
    themeColor?.setAttribute('content', color)

    if (brand?.whiteLabel) {
      const iconUrl = brand.logoUrl || faviconDataUrl(companyName, color)
      favicons.forEach((item) => {
        item.href = iconUrl
      })
      description?.setAttribute('content', `Portal do cliente de ${companyName}: ${pageTitle}.`)
    }

    return () => {
      document.title = previousTitle
      if (themeColor && previousThemeColor) themeColor.content = previousThemeColor
      favicons.forEach((item, index) => {
        if (previousFavicons[index]) item.href = previousFavicons[index]
      })
      if (description && previousDescription) description.content = previousDescription
    }
  }, [brand, companyName, pageTitle])
}

export function PortalBrandShell({
  brand,
  companyName,
  pageTitle,
  className,
  children,
}: {
  brand?: PortalBrand
  companyName: string
  pageTitle: string
  className?: string
  children: ReactNode
}) {
  const color = normalizePortalBrandColor(brand?.corPrincipal)
  usePortalDocumentBrand({ brand, companyName, pageTitle })

  return (
    <div
      className={cn('relative min-h-screen overflow-hidden bg-background', className)}
      style={portalBrandStyle(color)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% -25%, ${color} 0%, transparent 68%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function PortalBrandIdentity({
  brand,
  companyName,
  compact = false,
}: {
  brand?: PortalBrand
  companyName: string
  compact?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3" aria-label={`Portal de ${companyName}`}>
      {brand?.logoUrl ? (
        <img
          src={brand.logoUrl}
          alt={`Logo de ${companyName}`}
          className={cn('max-w-[12rem] object-contain object-left', compact ? 'h-8' : 'h-10')}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'grid shrink-0 place-items-center rounded-md bg-brand font-bold text-brand-contrast shadow-soft',
            compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
          )}
        >
          {initials(companyName)}
        </span>
      )}
      {!brand?.logoUrl && (
        <span className="truncate font-semibold tracking-[-0.02em] text-ink">{companyName}</span>
      )}
    </div>
  )
}

export function PortalAccessBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-secondary backdrop-blur">
      <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
      Ambiente seguro de revisão
    </span>
  )
}
