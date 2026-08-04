import { Avatar } from '@/components/ui/DataDisplay'
import type { Activity } from '@/types/domain'

export function ActivityPanel({ activities }: { activities: Activity[] }) {
  return (
    <section aria-label="Atividade da revisão" className="p-4">
      <h2 className="font-semibold">Atividade</h2>
      <ol className="mt-4 space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="flex gap-3">
            <Avatar name={activity.actor} />
            <div className="min-w-0 text-sm">
              <p>
                <strong>{activity.actor}</strong> {activity.action}
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(activity.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </li>
        ))}
        {!activities.length && (
          <li className="text-sm text-muted">Nenhuma atividade registrada neste material.</li>
        )}
      </ol>
    </section>
  )
}
