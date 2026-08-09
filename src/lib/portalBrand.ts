import type { CSSProperties } from 'react'

export type PortalBrand = {
  corPrincipal: string
  corSecundaria?: string
  tema?: 'escuro' | 'claro'
  fonte?: 'instrument' | 'serif' | 'sistema'
  estilo?: 'suave' | 'quadrado' | 'pill'
  logoUrl: string | null
  logoClaroUrl?: string | null
  logoEscuroUrl?: string | null
  capaUrl?: string | null
  fundoTipo?: 'cor' | 'gradiente' | 'imagem'
  fundoCor?: string
  fundoGradiente?: 'aurora' | 'oceano' | 'por-do-sol' | 'monocromatico'
  fundoImagemUrl?: string | null
  miniaturaPadraoUrl?: string | null
  marcaDaguaUrl?: string | null
  marcaDaguaOpacidade?: number
  nomePortal?: string
  mensagemAprovacao?: string
  mensagemAlteracoes?: string
  rodapeTexto?: string
  suporteEmail?: string
  suporteTelefone?: string
  suporteWhatsapp?: string
  mostrarPrazo?: boolean
  mostrarStatus?: boolean
  mostrarCliente?: boolean
  mostrarTipo?: boolean
  mostrarVersao?: boolean
  materiaisAprovados?: 'mostrar' | 'separar' | 'ocultar'
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

export function portalBrandStyle(brand?: PortalBrand): CSSProperties {
  const primary = normalizePortalBrandColor(brand?.corPrincipal)
  const secondary = normalizePortalBrandColor(brand?.corSecundaria ?? '#7c8cff')
  const mixColor = isDarkPortalColor(primary) ? 'white' : 'black'
  const claro = brand?.tema === 'claro'
  const radius = brand?.estilo === 'quadrado' ? '4px' : brand?.estilo === 'pill' ? '22px' : '12px'
  const font =
    brand?.fonte === 'serif'
      ? 'Instrument Serif, Georgia, serif'
      : brand?.fonte === 'sistema'
        ? 'Inter, system-ui, sans-serif'
        : 'Instrument Sans, sans-serif'

  return {
    ['--background' as string]: claro ? '#f4f6f8' : '#080b12',
    ['--surface' as string]: claro ? '#ffffff' : '#10151f',
    ['--surface-secondary' as string]: claro ? '#edf0f3' : '#151c28',
    ['--surface-elevated' as string]: claro ? '#ffffff' : '#1b2432',
    ['--text-primary' as string]: claro ? '#121820' : '#f6f8fb',
    ['--text-secondary' as string]: claro ? '#53606d' : '#a8b2c0',
    ['--text-muted' as string]: claro ? '#75808b' : '#778394',
    ['--border' as string]: claro ? '#dce1e6' : '#273140',
    ['--border-strong' as string]: claro ? '#c4cbd3' : '#3b4656',
    ['--portal-radius' as string]: radius,
    ['--accent-secondary' as string]: secondary,
    fontFamily: font,
    ['--portal-brand' as string]: primary,
    ['--brand-primary' as string]: primary,
    ['--brand-primary-hover' as string]: `color-mix(in srgb, ${primary} 84%, ${mixColor})`,
    ['--brand-primary-active' as string]: `color-mix(in srgb, ${primary} 72%, ${mixColor})`,
    ['--brand-soft' as string]: `color-mix(in srgb, ${primary} 14%, var(--surface))`,
    ['--brand-soft-hover' as string]: `color-mix(in srgb, ${primary} 20%, var(--surface))`,
    ['--brand-contrast' as string]: isDarkPortalColor(primary) ? '#ffffff' : '#10150b',
  }
}
