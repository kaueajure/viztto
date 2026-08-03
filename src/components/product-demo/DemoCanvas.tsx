import { AnimatePresence, motion } from 'motion/react'
import { ApprovalStamp, CollaborativeCursor, CommentPin } from '@/components/feedback/FeedbackComponents'
import { demoPins } from '@/data/productDemo'

export function DemoCanvas({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const cursorVisible = reducedMotion || step >= 1
  const cursorMoved = reducedMotion || step >= 2
  const pinVisible = reducedMotion || step >= 3
  const approved = reducedMotion || step >= 6

  return (
    <div className="relative min-h-[360px] overflow-hidden bg-surface-secondary p-3 surface-grid sm:min-h-[430px] sm:p-5">
      <div
        role="img"
        aria-label="Peça gráfica da campanha de lançamento com quatro comentários posicionados sobre o material"
        className="relative mx-auto h-[336px] max-w-[440px] overflow-hidden rounded-md border border-line bg-[#151816] shadow-raised sm:h-[390px]"
      >
        <div aria-hidden="true" className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-brand/85" />
        <div aria-hidden="true" className="absolute -bottom-14 -left-12 h-48 w-48 rotate-12 border-[28px] border-revision/80" />
        <div aria-hidden="true" className="absolute left-[48%] top-[12%] h-48 w-px rotate-[28deg] bg-line-strong" />
        <div aria-hidden="true" className="absolute bottom-0 right-[20%] top-0 w-px bg-line-subtle" />
        <div className="absolute left-[8%] top-[8%] text-[9px] font-semibold uppercase tracking-[0.2em] text-brand">
          Estúdio Viztto · 2026
        </div>
        <div className="absolute inset-x-[8%] top-[27%]">
          <p className="text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.78] tracking-[-0.07em] text-ink">
            FORMA
            <br />
            <span className="font-serif font-normal italic text-brand">em movimento</span>
          </p>
        </div>
        <div className="absolute bottom-[8%] right-[8%] max-w-32 text-right text-[9px] leading-relaxed text-secondary">
          Ideias ganham força quando o feedback encontra o lugar certo.
        </div>

        {demoPins.map((pin) => (
          <div key={pin.number} className={`absolute ${pin.position}`}>
            <CommentPin number={pin.number} state={pin.state} />
          </div>
        ))}

        <AnimatePresence>
          {pinVisible && (
            <motion.div
              className="absolute bottom-[35%] right-[28%]"
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.65 }}
              transition={{ duration: 0.26 }}
            >
              <CommentPin number={4} state="active" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cursorVisible && (
            <motion.div
              className="absolute left-[48%] top-[18%] z-20"
              initial={{ opacity: 0, x: 52, y: -30 }}
              animate={{ opacity: 1, x: cursorMoved ? 62 : 0, y: cursorMoved ? 112 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeInOut' }}
            >
              <CollaborativeCursor name="Marina" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {approved && (
            <motion.div
              className="absolute bottom-[12%] left-[12%]"
              initial={{ opacity: 0, scale: 0.86, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: reducedMotion ? 0 : 0.34 }}
            >
              <ApprovalStamp />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
