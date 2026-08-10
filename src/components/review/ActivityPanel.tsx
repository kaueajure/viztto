import { Avatar } from '@/components/ui/DataDisplay'
import type { Activity } from '@/types/domain'

export function ActivityPanel({
  activities,
  emptyLabel,
  emptyMessage,
  onSelectComment,
}: {
  activities: Activity[]
  emptyLabel?: string
  /** Alias de emptyLabel para chamadas mais descritivas. */
  emptyMessage?: string
  onSelectComment?: (commentId: string) => void
}) {
  const empty =
    emptyMessage ?? emptyLabel ?? 'Nenhuma atividade registrada neste material.'
  return (
    <section aria-label="Atividade da revisão" className="p-4">
      <h2 className="font-semibold">Atividade</h2>
      <ol className="mt-4 space-y-4">
        {activities.map((activity) => {
          const clicavel = Boolean(activity.commentId && onSelectComment)
          return (
            <li key={activity.id} className="flex gap-3">
              <Avatar name={activity.actor} />
              <div className="min-w-0 text-sm">
                {clicavel ? (
                  <button
                    type="button"
                    className="text-left hover:text-brand"
                    onClick={() => onSelectComment?.(activity.commentId!)}
                  >
                    <strong>{activity.actor}</strong> {activity.action}
                  </button>
                ) : (
                  <p>
                    <strong>{activity.actor}</strong> {activity.action}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {new Date(activity.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </li>
          )
        })}
        {!activities.length && <li className="text-sm text-muted">{empty}</li>}
      </ol>
    </section>
  )
}
