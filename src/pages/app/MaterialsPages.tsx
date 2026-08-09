import { FileImage, Play } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { MaterialStatus, PageHeader, SearchField } from '@/components/app/AppUi'
import { LinkButton } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'
import { MaterialPreview } from '@/components/review/MaterialPreview'

export function MaterialsPage() {
  const { projects, clients, materials, materialVersions } = useAppData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const filtered = materials.filter(
    (item) =>
      (type === 'all' || item.type === type) &&
      (status === 'all' || item.status === status) &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  )
  const context = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    return { project, client: clients.find((item) => item.id === project?.clientId) }
  }
  const thumbUrl = (material: (typeof materials)[number]) =>
    materialVersions.find((item) => item.id === material.currentVersionId)?.imageUrl ??
    materialVersions.find((item) => item.materialId === material.id)?.imageUrl ??
    ''
  return (
    <div>
      <PageHeader
        title="Materiais"
        description="Todos os materiais"
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_13rem_13rem]">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar materiais" />
        <select
          aria-label="Filtrar por tipo"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Todos os formatos</option>
          <option value="image">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="pdf">PDF</option>
        </select>
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="in-review">Em revisão</option>
          <option value="waiting-approval">Aguardando</option>
          <option value="changes-requested">Alterações</option>
          <option value="approved">Aprovados</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((material) => {
          const itemContext = context(material.projectId)
          const url = thumbUrl(material)
          return (
            <Link
              to={`/app/materiais/${material.id}`}
              key={material.id}
              className="overflow-hidden rounded-lg border border-line bg-surface hover:border-line-strong"
            >
              <div className="grid min-h-36 place-items-center overflow-hidden bg-surface-secondary surface-grid">
                {url && material.type === 'image' ? (
                  <img
                    src={url}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                ) : url && material.type === 'video' ? (
                  <video src={url} className="h-36 w-full object-cover" muted preload="metadata" />
                ) : url && material.type === 'pdf' ? (
                  <div className="relative h-36 w-full overflow-hidden bg-white">
                    <iframe
                      src={`${url}#page=1&view=FitH`}
                      title={`Prévia de ${material.name}`}
                      className="pointer-events-none h-[220%] w-full origin-top scale-[0.55]"
                      tabIndex={-1}
                      aria-hidden
                    />
                    <span className="absolute bottom-2 left-2 rounded-sm bg-revision px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-background">
                      PDF
                    </span>
                  </div>
                ) : (
                  <FileImage className="h-9 w-9 text-brand" />
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{material.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {itemContext.client?.name} · {itemContext.project?.name}
                    </p>
                  </div>
                  <MaterialStatus status={material.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>v{material.currentVersion}</Badge>
                  <Badge>
                    {
                      (
                        {
                          image: 'Imagem',
                          video: 'Vídeo',
                          pdf: 'PDF',
                          presentation: 'Apresentação',
                          web: 'Web',
                        } as const
                      )[material.type]
                    }
                  </Badge>
                  <span className="ml-auto text-xs text-muted">
                    {material.unresolvedCommentCount} pendentes
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {!filtered.length && (
        <div className="mt-6">
          <EmptyState
            title="Nenhum material encontrado"
            description="Ajuste os filtros utilizados."
          />
        </div>
      )}
    </div>
  )
}

export function MaterialDetailPage() {
  const { materialId } = useParams()
  const { projects, clients, materials, materialVersions, comments, activities } = useAppData()
  const material = materials.find((item) => item.id === materialId)
  if (!material)
    return (
      <EmptyState
        title="Material não encontrado"
        description="O material solicitado não está disponível."
      />
    )
  const project = projects.find((item) => item.id === material.projectId)
  const client = clients.find((item) => item.id === project?.clientId)
  const versions = materialVersions
    .filter((item) => item.materialId === material.id)
    .sort((a, b) => b.number - a.number)
  const recentActivity = activities.filter((item) => item.materialId === material.id).slice(0, 4)
  return (
    <div>
      <PageHeader
        title={material.name}
        description={`${client?.name ?? 'Cliente'} · ${project?.name ?? 'Projeto'}`}
      >
        <div className="mt-3 flex gap-2">
          <Badge>v{material.currentVersion}</Badge>
          <MaterialStatus status={material.status} />
        </div>
      </PageHeader>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_21rem]">
        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="grid min-h-[24rem] place-items-center overflow-hidden rounded-md border border-line bg-surface-secondary surface-grid">
            <MaterialPreview
              type={material.type}
              url={versions.find((item) => item.id === material.currentVersionId)?.imageUrl ?? ''}
              title={material.name}
              className="max-h-[34rem]"
            />
          </div>
          <LinkButton to={`/app/materiais/${material.id}/revisao`} className="mt-4 w-full">
            <Play className="h-4 w-4" /> Abrir revisão
          </LinkButton>
        </section>
        <aside className="space-y-5">
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Versões</h2>
            <div className="mt-4 space-y-2">
              {versions.map((version) => (
                <div
                  className="rounded-md border border-line bg-surface-secondary p-3"
                  key={version.id}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      v{version.number} · {version.label}
                    </p>
                    {version.approved && <Badge tone="approval">Aprovada</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted">{version.createdBy}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Comentários</h2>
            <p className="mt-3 text-sm text-secondary">
              {comments.filter((item) => item.materialId === material.id).length} no histórico ·{' '}
              {material.unresolvedCommentCount} pendentes.
            </p>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Histórico</h2>
            <div className="mt-3 space-y-3 text-sm text-secondary">
              {recentActivity.map((item) => (
                <p key={item.id}>
                  <strong className="text-ink">{item.actor}</strong> {item.action}
                </p>
              ))}
              {!recentActivity.length && <p>Nenhuma ação registrada.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
