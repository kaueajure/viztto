import { MessageCircleMore } from 'lucide-react'

export function MessageBubble() {
  return (
    <article className="w-full max-w-[300px] rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        <MessageCircleMore className="h-3.5 w-3.5 text-approval" /> Mensagem
      </div>
      <p className="mt-3 text-sm font-medium leading-snug">Troca aquela imagem da segunda arte.</p>
      <p className="mt-2 text-right text-[10px] text-muted">10:42</p>
    </article>
  )
}
