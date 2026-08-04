import { FileImage, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MaterialStatus, PageHeader, SearchField } from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/DataDisplay'
import { Tooltip } from '@/components/ui/Interactive'
import { useAppData } from '@/contexts/AppDataContext'
import { demoMaterials, demoVersions } from '@/data/mock/materials'

export function MaterialsPage() {
  const { projects, clients } = useAppData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const filtered = demoMaterials.filter(
    (item) =>
      (type === 'all' || item.type === type) &&
      (status === 'all' || item.status === status) &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  )
  const context = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    return { project, client: clients.find((item) => item.id === project?.clientId) }
  }
  return (
    <div>
      <PageHeader
        title="Materiais"
        description="Biblioteca geral de arquivos, versões e estados de revisão."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_13rem_13rem]">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar materiais" />
        <select
          aria-label="Filtrar por tipo"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Todos os formatos</option>
          {['image', 'video', 'pdf', 'presentation', 'web'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="waiting">Aguardando</option>
          <option value="changes">Alterações</option>
          <option value="approved">Aprovados</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((material) => {
          const data = context(material.projectId)
          return (
            <Link
              to={`/app/materiais/${material.id}`}
              key={material.id}
              className="overflow-hidden rounded-lg border border-line bg-surface hover:border-line-strong"
            >
              <div className="grid min-h-36 place-items-center bg-surface-secondary surface-grid">
                <FileImage className="h-9 w-9 text-brand" />
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{material.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {data.client?.name} · {data.project?.name}
                    </p>
                  </div>
                  <MaterialStatus status={material.status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Badge>v{material.currentVersion}</Badge>
                  <Badge>{material.type}</Badge>
                  <span className="ml-auto text-xs text-muted">
                    {material.commentCount} comentários
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
  const { projects, clients } = useAppData()
  const material = demoMaterials.find((item) => item.id === materialId)
  if (!material)
    return (
      <EmptyState
        title="Material não encontrado"
        description="O material solicitado não está disponível."
      />
    )
  const project = projects.find((item) => item.id === material.projectId)
  const client = clients.find((item) => item.id === project?.clientId)
  const versions =
    material.id === 'material-carousel'
      ? demoVersions
      : [
          {
            id: 'current',
            materialId: material.id,
            number: material.currentVersion,
            label: 'Versão atual',
            createdBy: 'Marina',
            createdAt: material.updatedAt,
            approved: material.status === 'approved',
          },
        ]
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
          <div className="grid min-h-[24rem] place-items-center rounded-md border border-line bg-surface-secondary surface-grid">
            <div className="text-center">
              <FileImage className="mx-auto h-12 w-12 text-brand" />
              <p className="mt-4 font-semibold">Pré-visualização preparatória</p>
              <p className="mt-1 text-sm text-muted">
                O visualizador completo será desenvolvido na próxima etapa.
              </p>
            </div>
          </div>
          <Tooltip label="O ambiente completo de revisão será desenvolvido na próxima etapa.">
            <Button disabled className="mt-4 w-full">
              <Lock className="h-4 w-4" /> Abrir revisão
            </Button>
          </Tooltip>
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
                  <p className="text-sm font-semibold">
                    v{version.number} · {version.label}
                  </p>
                  <p className="mt-1 text-xs text-muted">{version.createdBy}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Comentários recentes</h2>
            <p className="mt-3 text-sm text-secondary">
              {material.commentCount
                ? `${material.commentCount} comentários relacionados à versão atual.`
                : 'Nenhum comentário aberto.'}
            </p>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold">Histórico</h2>
            <p className="mt-3 text-sm text-secondary">Versão publicada por Marina · hoje, 14:20</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
