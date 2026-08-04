import { motion } from 'motion/react'
import { MessageSquareText } from 'lucide-react'
import { CommentCard } from '@/components/feedback/FeedbackComponents'
import { productDemo, type DemoPhase } from '@/data/productDemo'

const ease = [0.22, 1, 0.36, 1] as const

export function DemoSidebar({
  phase,
  reducedMotion,
}: {
  phase: DemoPhase
  reducedMotion: boolean
}) {
  const commentVisible = phase === 'commenting' || phase === 'new-version' || phase === 'approved'
  const commentDelay = phase === 'commenting' ? 1.55 : 0

  return (
    <aside className="relative min-h-[19rem] border-t border-line bg-surface p-3 xl:min-h-0 xl:border-l xl:border-t-0 xl:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Comentário selecionado</p>
        <span className="text-[10px] text-muted">
          {commentVisible ? '4' : '3'} de {productDemo.commentCount}
        </span>
      </div>
      <motion.div
        aria-hidden={commentVisible}
        className="absolute inset-x-3 top-12 grid min-h-52 place-items-center rounded-lg border border-dashed border-line bg-background px-5 text-center xl:inset-x-4"
        animate={{ opacity: commentVisible ? 0 : 1, y: commentVisible ? -4 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease }}
      >
        <div>
          <MessageSquareText className="mx-auto h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-semibold">Material aguardando revisão</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            O comentário aparece aqui quando Marina marca um ponto.
          </p>
        </div>
      </motion.div>
      <motion.div
        aria-hidden={!commentVisible}
        animate={{ opacity: commentVisible ? 1 : 0, y: commentVisible ? 0 : 6 }}
        transition={{
          delay: reducedMotion ? 0 : commentDelay,
          duration: reducedMotion ? 0 : 0.28,
          ease,
        }}
      >
        <CommentCard
          compact
          showActions={false}
          name={productDemo.selectedComment.author}
          time={productDemo.selectedComment.time}
          comment={productDemo.selectedComment.text}
          status={phase === 'approved' ? 'resolved' : 'changes'}
        />
        <div className="mt-4 hidden rounded-md border border-dashed border-line px-3 py-3 text-xs leading-relaxed text-muted xl:block">
          O comentário permanece ligado a este ponto nas próximas versões.
        </div>
      </motion.div>
    </aside>
  )
}
