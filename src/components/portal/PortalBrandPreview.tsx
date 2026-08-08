import { Check, MessageSquarePlus } from 'lucide-react'
import { PortalBrandIdentity } from '@/components/portal/PortalBrand'
import { portalBrandStyle } from '@/lib/portalBrand'

export function PortalBrandPreview({
  companyName,
  color,
  logoUrl,
}: {
  companyName: string
  color: string
  logoUrl: string | null
}) {
  const name = companyName.trim() || 'Sua empresa'

  return (
    <div
      className="overflow-hidden rounded-lg border border-line bg-background"
      style={portalBrandStyle(color)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface/80 px-4 py-3">
        <PortalBrandIdentity
          compact
          companyName={name}
          brand={{ corPrincipal: color, logoUrl, whiteLabel: true }}
        />
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">
          Prévia
        </span>
      </div>
      <div className="relative p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)`,
          }}
        />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            Portal do cliente
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">Campanha de lançamento</p>
          <p className="mt-1 text-xs text-secondary">Materiais disponíveis para sua revisão.</p>
          <div className="mt-4 rounded-md border border-line bg-surface p-3">
            <div className="h-14 rounded-sm bg-gradient-to-br from-brand-soft to-surface-secondary" />
            <p className="mt-3 text-sm font-semibold text-ink">Peça principal</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1 text-[10px] text-secondary">
                <MessageSquarePlus className="h-3 w-3" /> Comentar
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm bg-brand px-2 py-1 text-[10px] font-semibold text-brand-contrast">
                <Check className="h-3 w-3" /> Aprovar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
