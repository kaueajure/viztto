import { ArrowLeft, Check, MessageSquarePlus, Minus, MoreHorizontal, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MaterialStatus } from '@/components/app/AppUi'
import { Button, IconButton } from '@/components/ui/Button'
import { AvatarGroup, Badge, Breadcrumb } from '@/components/ui/DataDisplay'
import type { Client, Material, MaterialVersion, Project } from '@/types/domain'

export function ReviewToolbar({
  client,
  project,
  material,
  activeVersion,
  zoom,
  creationMode,
  onToggleCreation,
  onZoom,
  onFit,
  onRequestChanges,
  onApprove,
  onReopen,
  onReturnToCurrent,
  onOpenMobilePanel,
}: {
  client?: Client
  project?: Project
  material: Material
  activeVersion: MaterialVersion
  zoom: number
  creationMode: boolean
  onToggleCreation: () => void
  onZoom: (value: number) => void
  onFit: () => void
  onRequestChanges: () => void
  onApprove: () => void
  onReopen: () => void
  onReturnToCurrent: () => void
  onOpenMobilePanel: () => void
}) {
  const isCurrentVersion = activeVersion.id === material.currentVersionId
  return (
    <header className="border-b border-line bg-surface">
      <div className="flex min-h-16 items-center gap-3 px-3 sm:px-4">
        <Link
          to={`/app/materiais/${material.id}`}
          aria-label="Voltar para o material"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line hover:bg-surface-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="hidden xl:block">
            <Breadcrumb items={[client?.name ?? 'Cliente', project?.name ?? 'Projeto']} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold sm:text-base">{material.name}</h1>
            <Badge tone={isCurrentVersion ? 'brand' : 'neutral'}>v{activeVersion.number}</Badge>
            <span className="hidden sm:inline-flex">
              <MaterialStatus status={material.status} />
            </span>
          </div>
        </div>
        {!isCurrentVersion && (
          <Button className="hidden xl:inline-flex" variant="ghost" onClick={onReturnToCurrent}>
            Voltar para v{material.currentVersion}
          </Button>
        )}
        <div className="hidden items-center gap-1 lg:flex" aria-label="Controles de zoom">
          <IconButton label="Diminuir zoom" onClick={() => onZoom(zoom - 25)}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => onZoom(100)}
            className="min-h-11 min-w-16 rounded-md text-xs font-semibold"
            aria-label={`Zoom atual ${zoom}%. Restaurar 100%`}
          >
            {zoom}%
          </button>
          <IconButton label="Aumentar zoom" onClick={() => onZoom(zoom + 25)}>
            <Plus className="h-4 w-4" />
          </IconButton>
          <Button variant="ghost" onClick={onFit}>
            Ajustar
          </Button>
        </div>
        <div className="hidden xl:block">
          <AvatarGroup names={project?.members ?? ['Marina']} />
        </div>
        <Button
          variant={creationMode ? 'primary' : 'secondary'}
          className="hidden lg:inline-flex"
          onClick={onToggleCreation}
          aria-pressed={creationMode}
        >
          <MessageSquarePlus className="h-4 w-4" /> Adicionar comentário
        </Button>
        {material.status === 'approved' ? (
          <Button className="hidden lg:inline-flex" variant="secondary" onClick={onReopen}>
            Reabrir revisão
          </Button>
        ) : (
          <>
            <Button
              className="hidden xl:inline-flex"
              variant="outline"
              disabled={!isCurrentVersion}
              onClick={onRequestChanges}
            >
              Solicitar alterações
            </Button>
            <Button className="hidden lg:inline-flex" disabled={!isCurrentVersion} onClick={onApprove}>
              <Check className="h-4 w-4" /> Aprovar
            </Button>
          </>
        )}
        <IconButton label="Abrir ações e painéis" className="lg:hidden" onClick={onOpenMobilePanel}>
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  )
}
