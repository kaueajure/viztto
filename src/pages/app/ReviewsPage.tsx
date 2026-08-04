import { PageHeader, MaterialStatus } from '@/components/app/AppUi'
import { Badge } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'
import { demoMaterials } from '@/data/mock/materials'

export default function ReviewsPage() {
  const { projects, clients } = useAppData()
  const context = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    return { project, client: clients.find((item) => item.id === project?.clientId) }
  }
  const groups = [
    ['Aguardando aprovação', demoMaterials.filter((item) => item.status === 'waiting')],
    ['Alterações solicitadas', demoMaterials.filter((item) => item.status === 'changes')],
    ['Aprovadas recentemente', demoMaterials.filter((item) => item.status === 'approved')],
    ['Sem responsável', demoMaterials.filter((item) => item.status === 'draft')],
  ] as const
  return (
    <div>
      <PageHeader
        title="Revisões"
        description="Fila central de decisões, alterações e materiais aguardando responsáveis."
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {groups.map(([title, materials]) => (
          <section className="rounded-lg border border-line bg-surface" key={title}>
            <h2 className="border-b border-line p-4 font-semibold">
              {title} <span className="ml-2 text-xs text-muted">{materials.length}</span>
            </h2>
            <div className="divide-y divide-line">
              {materials.map((material) => {
                const data = context(material.projectId)
                return (
                  <div className="p-4" key={material.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{material.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {data.client?.name} · {data.project?.name}
                        </p>
                      </div>
                      <MaterialStatus status={material.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>v{material.currentVersion}</Badge>
                      <Badge>{material.commentCount} abertos</Badge>
                      <span className="text-xs text-secondary">Aprovador: Marina</span>
                    </div>
                  </div>
                )
              })}
              {!materials.length && (
                <p className="p-4 text-sm text-muted">Nenhum item nesta fila.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
