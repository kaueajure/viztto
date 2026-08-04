import { AlertCircle, CheckCircle2, Clock3, FolderKanban } from 'lucide-react'
import { Link } from 'react-router'
import { MaterialStatus, PageHeader, ProjectStatusBadge } from '@/components/app/AppUi'
import { Avatar, Card } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function DashboardPage() {
  const { clients, projects, materials, activities } = useAppData()
  if (!clients.length || !projects.length)
    return (
      <div>
        <PageHeader
          title={`${greeting()}, Marina`}
          description="Aqui está o que precisa da sua atenção hoje."
        />
        <div className="mt-10 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
          <FolderKanban className="mx-auto text-brand" />
          <h2 className="mt-4 text-2xl font-semibold">Crie seu primeiro fluxo de revisão</h2>
          <p className="mx-auto mt-2 max-w-lg text-secondary">
            Adicione um cliente, crie um projeto e envie o primeiro material para começar.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              className="rounded-md bg-brand px-4 py-3 text-sm font-semibold text-brand-contrast"
              to="/app/projetos/novo"
            >
              Criar projeto
            </Link>
            <Link
              className="rounded-md border border-line px-4 py-3 text-sm font-semibold"
              to="/app/clientes/novo"
            >
              Adicionar cliente
            </Link>
          </div>
        </div>
      </div>
    )
  const stats = [
    [
      'Aguardando aprovação',
      materials.filter((item) => item.status === 'waiting-approval').length,
      Clock3,
      'text-warning',
    ],
    [
      'Alterações solicitadas',
      materials.filter((item) => item.status === 'changes-requested').length,
      AlertCircle,
      'text-revision',
    ],
    [
      'Projetos ativos',
      projects.filter((item) => !['approved', 'archived'].includes(item.status)).length,
      FolderKanban,
      'text-brand',
    ],
    [
      'Aprovados nesta semana',
      materials.filter((item) => item.status === 'approved').length,
      CheckCircle2,
      'text-approval',
    ],
  ] as const
  const clientName = (id: string) => clients.find((item) => item.id === id)?.name ?? 'Cliente'
  return (
    <div>
      <PageHeader
        title={`${greeting()}, Marina`}
        description="Aqui está o que precisa da sua atenção hoje."
        action={{ label: 'Novo projeto', to: '/app/projetos/novo' }}
      />
      <section aria-label="Resumo" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, color]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className={`grid h-9 w-9 place-items-center rounded-md bg-surface-secondary ${color}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <strong className="text-2xl">{value}</strong>
            </div>
            <p className="mt-4 text-sm text-secondary">{label}</p>
          </Card>
        ))}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]">
        <section className="rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line p-5">
            <h2 className="font-semibold">Precisa da sua atenção</h2>
            <Link to="/app/projetos" className="text-sm text-brand">
              Ver projetos
            </Link>
          </div>
          <div className="divide-y divide-line">
            {projects
              .filter((item) =>
                ['changes-requested', 'waiting-approval', 'in-review'].includes(item.status),
              )
              .slice(0, 4)
              .map((project) => (
                <Link
                  to={`/app/projetos/${project.id}`}
                  key={project.id}
                  className="grid gap-3 p-4 hover:bg-surface-secondary sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {clientName(project.clientId)} · {project.commentCount} comentários
                    </p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                  <span className="text-xs text-secondary">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString('pt-BR')
                      : 'Sem prazo'}
                  </span>
                </Link>
              ))}
          </div>
        </section>
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Atividade recente</h2>
          <ol className="mt-5 space-y-5">
            {activities.slice(0, 6).map((activity) => (
              <li className="flex gap-3" key={activity.id}>
                <Avatar name={activity.actor} />
                <div>
                  <p className="text-sm">
                    <strong>{activity.actor}</strong> {activity.action}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {activity.target} · {new Date(activity.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.65fr]">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Materiais recentes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {materials.slice(0, 4).map((material) => (
              <Link
                to={`/app/materiais/${material.id}`}
                className="rounded-md border border-line bg-background p-4 hover:border-line-strong"
                key={material.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{material.name}</p>
                    <p className="mt-1 text-xs uppercase text-muted">
                      {material.type} · v{material.currentVersion}
                    </p>
                  </div>
                  <MaterialStatus status={material.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Próximos prazos</h2>
          <div className="mt-4 space-y-3">
            {projects
              .filter((item) => item.dueDate && item.status !== 'approved')
              .slice(0, 4)
              .map((project) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-md bg-surface-secondary p-3"
                  key={project.id}
                >
                  <div>
                    <p className="text-sm font-semibold">{project.name}</p>
                    <p className="text-xs text-muted">{clientName(project.clientId)}</p>
                  </div>
                  <span className="text-xs text-warning">
                    {new Date(project.dueDate!).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}
