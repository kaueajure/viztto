import type { CSSProperties } from 'react'

export type PortalBrand = {
  corPrincipal: string
  logoUrl: string | null
  whiteLabel: boolean
}

const DEFAULT_BRAND = '#b8ff4f'

export function normalizePortalBrandColor(value: string | null | undefined) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_BRAND
}

export function isDarkPortalColor(hex: string) {
  const value = hex.slice(1)
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  return luminance < 0.52
}

export function portalBrandStyle(color: string | null | undefined): CSSProperties {
  const primary = normalizePortalBrandColor(color)
  const mixColor = isDarkPortalColor(primary) ? 'white' : 'black'

  return {
    ['--portal-brand' as string]: primary,
    ['--brand-primary' as string]: primary,
    ['--brand-primary-hover' as string]: `color-mix(in srgb, ${primary} 84%, ${mixColor})`,
    ['--brand-primary-active' as string]: `color-mix(in srgb, ${primary} 72%, ${mixColor})`,
    ['--brand-soft' as string]: `color-mix(in srgb, ${primary} 14%, var(--surface))`,
    ['--brand-soft-hover' as string]: `color-mix(in srgb, ${primary} 20%, var(--surface))`,
    ['--brand-contrast' as string]: isDarkPortalColor(primary) ? '#ffffff' : '#10150b',
  }
}
