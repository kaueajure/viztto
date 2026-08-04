import { motion, type Variants } from 'motion/react'
import {
  ApprovalStamp,
  CollaborativeCursor,
  CommentPin,
} from '@/components/feedback/FeedbackComponents'
import { demoPins, type DemoPhase } from '@/data/productDemo'

const ease = [0.22, 1, 0.36, 1] as const

const cursorVariants: Variants = {
  waiting: { opacity: 0, x: 52, y: -30 },
  commenting: {
    opacity: [0, 1, 1],
    x: [52, 0, 62],
    y: [-30, 0, 112],
    transition: { duration: 1.25, times: [0, 0.28, 1], ease },
  },
  'new-version': { opacity: 0, x: 62, y: 112, transition: { duration: 0.22 } },
  approved: { opacity: 0, x: 62, y: 112 },
  resetting: { opacity: 0, x: 62, y: 112, transition: { duration: 0.2 } },
}

const pinVariants: Variants = {
  waiting: { opacity: 0, scale: 0.76 },
  commenting: {
    opacity: 1,
    scale: 1,
    transition: { delay: 1.22, duration: 0.26, ease },
  },
  'new-version': { opacity: 1, scale: 1 },
  approved: { opacity: 1, scale: 1 },
  resetting: { opacity: 0, scale: 0.92, transition: { duration: 0.24 } },
}

const stampVariants: Variants = {
  waiting: { opacity: 0, scale: 0.92, y: 6 },
  commenting: { opacity: 0, scale: 0.92, y: 6 },
  'new-version': { opacity: 0, scale: 0.92, y: 6 },
  approved: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.3, duration: 0.38, ease },
  },
  resetting: { opacity: 0, scale: 0.96, y: 3, transition: { duration: 0.22 } },
}

export function DemoCanvas({ phase, reducedMotion }: { phase: DemoPhase; reducedMotion: boolean }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden bg-surface-secondary p-3 surface-grid sm:min-h-[430px] sm:p-5">
      <div
        role="group"
        aria-label="Peça gráfica da campanha de lançamento com comentários posicionados sobre o material"
        className="relative mx-auto h-[336px] max-w-[440px] overflow-hidden rounded-md border border-line bg-[#151816] shadow-raised sm:h-[390px]"
      >
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-brand/85"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-14 -left-12 h-48 w-48 rotate-12 border-[28px] border-revision/80"
        />
        <div
          aria-hidden="true"
          className="absolute left-[48%] top-[12%] h-48 w-px rotate-[28deg] bg-line-strong"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-[20%] top-0 w-px bg-line-subtle"
        />
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

        <div className="opacity-50" aria-hidden="true">
          {demoPins.map((pin) => (
            <div key={pin.number} className={`absolute ${pin.position}`}>
              <CommentPin number={pin.number} state={pin.state} />
            </div>
          ))}
        </div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-[35%] right-[28%]"
          variants={pinVariants}
          initial={false}
          animate={reducedMotion ? 'approved' : phase}
        >
          <CommentPin number={4} state="active" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="absolute left-[48%] top-[18%] z-20"
          variants={cursorVariants}
          initial={false}
          animate={reducedMotion ? 'approved' : phase}
        >
          <CollaborativeCursor name="Marina" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-[12%] left-[12%]"
          variants={stampVariants}
          initial={false}
          animate={reducedMotion ? 'approved' : phase}
        >
          <ApprovalStamp />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-4 left-4 rounded-sm border border-line bg-background/90 px-2.5 py-1.5 text-[10px] font-semibold text-brand shadow-soft"
          initial={false}
          animate={{
            opacity: phase === 'new-version' ? 1 : 0,
            y: phase === 'new-version' ? 0 : 5,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.24, ease }}
        >
          Alteração enviada · v3
        </motion.div>
      </div>
    </div>
  )
}
