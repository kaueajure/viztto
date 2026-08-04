import { CheckCircle2, GitCompareArrows, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/DataDisplay'
import { cn } from '@/lib/cn'
import type { MaterialVersion } from '@/types/domain'

export function VersionsPanel({
  versions,
  activeId,
  currentId,
  onSelect,
  onNewVersion,
  onCompare,
}: {
  versions: MaterialVersion[]
  activeId: string
  currentId: string
  onSelect: (versionId: string) => void
  onNewVersion: () => void
  onCompare: () => void
}) {
  return (
    <section aria-label="Versões do material" className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Versões</h2>
        <Button className="min-h-9 px-3 text-xs" onClick={onNewVersion}>
          <Plus className="h-3.5 w-3.5" /> Nova versão
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {[...versions]
          .sort((a, b) => b.number - a.number)
          .map((version) => (
            <button
              key={version.id}
              type="button"
              aria-pressed={activeId === version.id}
              onClick={() => onSelect(version.id)}
              className={cn(
                'w-full rounded-md border p-3 text-left transition-colors',
                activeId === version.id
                  ? 'border-brand bg-brand-soft'
                  : 'border-line bg-surface hover:bg-surface-secondary',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">
                  v{version.number} · {version.label}
                </strong>
                {version.approved && <CheckCircle2 className="h-4 w-4 text-approval" />}
              </div>
              <p className="mt-1 text-xs text-muted">
                {version.createdBy} · {new Date(version.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-2 flex gap-2">
                {version.id === currentId && <Badge tone="brand">Atual</Badge>}
                {version.approved && <Badge tone="approval">Aprovada</Badge>}
              </div>
            </button>
          ))}
      </div>
      {versions.length > 1 && (
        <Button variant="secondary" className="mt-4 w-full" onClick={onCompare}>
          <GitCompareArrows className="h-4 w-4" /> Comparar versões
        </Button>
      )}
    </section>
  )
}
