import { motion } from 'motion/react'
import { CommentCard } from '@/components/feedback/FeedbackComponents'
import { productDemo } from '@/data/productDemo'

export function DemoSidebar({ highlighted }: { highlighted: boolean }) {
  return (
    <aside className="border-t border-line bg-surface p-3 xl:border-l xl:border-t-0 xl:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Comentário selecionado</p>
        <span className="text-[10px] text-muted">4 de {productDemo.commentCount}</span>
      </div>
      <motion.div
        animate={{ opacity: highlighted ? 1 : 0.66, y: highlighted ? 0 : 4 }}
        transition={{ duration: 0.28 }}
      >
        <CommentCard
          compact
          showActions
          name={productDemo.selectedComment.author}
          time={productDemo.selectedComment.time}
          comment={productDemo.selectedComment.text}
          status="changes"
        />
      </motion.div>
      <div className="mt-4 hidden rounded-md border border-dashed border-line px-3 py-3 text-xs leading-relaxed text-muted xl:block">
        O comentário permanece ligado a este ponto nas próximas versões.
      </div>
    </aside>
  )
}
