import type { ReactNode } from 'react'

export function SettingsSection({
  title,
  description,
  children,
  danger,
}: {
  title: string
  description?: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section
      className={
        danger
          ? 'rounded-lg border border-revision/40 bg-revision/5 p-5'
          : 'rounded-lg border border-line bg-surface p-5'
      }
    >
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
