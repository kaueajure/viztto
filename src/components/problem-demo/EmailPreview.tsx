import { Mail } from 'lucide-react'

export function EmailPreview() {
  return (
    <article className="w-full max-w-[340px] rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line-subtle pb-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          <Mail className="h-3.5 w-3.5 text-accent" /> E-mail
        </span>
        <span className="text-[10px] text-muted">11:07</span>
      </div>
      <p className="mt-3 text-sm font-semibold">Ajustes finais da campanha</p>
      <p className="mt-1 text-xs leading-relaxed text-secondary">
        Conforme conversamos, seguem mais algumas alterações…
      </p>
    </article>
  )
}
