import { Link } from 'react-router'
import { PageHeader, MaterialStatus } from '@/components/app/AppUi'
import { Badge } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'

export default function ReviewsPage() {
  const { projects, clients, materials } = useAppData()
  const context = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    return { project, client: clients.find((item) => item.id === project?.clientId) }
  }
  const groups = [
    ['Aguardando aprovação', materials.filter((item) => item.status === 'waiting-approval')],
    ['Alterações solicitadas', materials.filter((item) => item.status === 'changes-requested')],
    ['Em revisão', materials.filter((item) => item.status === 'in-review')],
    ['Aprovadas recentemente', materials.filter((item) => item.status === 'approved')],
  ] as const
  return (
    <div>
      <PageHeader
        title="Revisões"
        description="Materiais aguardando decisão"
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {groups.map(([title, items]) => (
          <section className="rounded-lg border border-line bg-surface" key={title}>
            <h2 className="border-b border-line p-4 font-semibold">
              {title} <span className="ml-2 text-xs text-muted">{items.length}</span>
            </h2>
            <div className="divide-y divide-line">
              {items.map((material) => {
                const itemContext = context(material.projectId)
                return (
                  <Link
                    to={`/app/materiais/${material.id}/revisao`}
                    className="block p-4 hover:bg-surface-secondary"
                    key={material.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{material.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {itemContext.client?.name} · {itemContext.project?.name}
                        </p>
                      </div>
                      <MaterialStatus status={material.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>v{material.currentVersion}</Badge>
                      <Badge tone={material.unresolvedCommentCount ? 'revision' : 'neutral'}>
                        {material.unresolvedCommentCount} pendentes
                      </Badge>
                      <span className="text-xs text-secondary">
                        {itemContext.project?.members?.[0]
                          ? `Responsável: ${itemContext.project.members[0]}`
                          : 'Sem responsável'}
                      </span>
                    </div>
                  </Link>
                )
              })}
              {!items.length && <p className="p-4 text-sm text-muted">Nenhum item nesta fila.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
