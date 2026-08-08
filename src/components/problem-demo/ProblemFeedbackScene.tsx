import {
  FileText,
  MessageCircleMore,
  Mic,
  Play,
} from 'lucide-react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const ease = [0.22, 1, 0.36, 1] as const
const ENTRANCE_MS = 1100

function FeedbackMessage({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-2 z-20 w-[min(11.5rem,46%)] sm:left-1 sm:top-3 sm:w-48"
      style={{ transform: 'translateZ(12px)' }}
    >
      <motion.article
        initial={false}
        animate={
          visible
            ? { opacity: 1, x: 0, y: 0, scale: 1 }
            : { opacity: 0, x: -14, y: 8, scale: 0.96 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.34, delay: reducedMotion ? 0 : 0.18, ease }}
      >
        <div className="rounded-lg border border-line bg-surface p-3 shadow-soft">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            <MessageCircleMore className="h-3 w-3 text-secondary" />
            Mensagem
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink">“Aumenta o logo um pouco”</p>
        </div>
      </motion.article>
    </div>
  )
}

function FeedbackAudio({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute right-0 top-6 z-20 w-[min(10.5rem,42%)] sm:right-1 sm:top-8 sm:w-44"
      style={{ transform: 'translateZ(10px)' }}
    >
      <motion.article
        initial={false}
        animate={
          visible
            ? { opacity: 1, x: 0, y: 0, scale: 1 }
            : { opacity: 0, x: 14, y: 6, scale: 0.96 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.34, delay: reducedMotion ? 0 : 0.32, ease }}
      >
        <div className="rounded-lg border border-line bg-surface-elevated p-3 shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Áudio</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warning-soft text-warning">
              <Play className="h-3 w-3 fill-current" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex h-4 items-end gap-0.5" aria-hidden="true">
                {[6, 11, 8, 14, 9, 12, 7, 10].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-secondary/55"
                    style={{ height: h }}
                  />
                ))}
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                <Mic className="h-2.5 w-2.5" /> 0:47
              </p>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

function FeedbackFile({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-2 right-1 z-20 w-[min(13rem,58%)] sm:bottom-3 sm:right-2 sm:w-56"
      style={{ transform: 'translateZ(8px)' }}
    >
      <motion.article
        initial={false}
        animate={
          visible
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 12, scale: 0.96 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.34, delay: reducedMotion ? 0 : 0.46, ease }}
      >
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-xs shadow-soft">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className="truncate text-secondary">campanha_final_v4.pdf</span>
        </div>
      </motion.article>
    </div>
  )
}

function FeedbackComment({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-[30%] left-[4%] z-30 sm:left-[6%]"
      style={{ transform: 'translateZ(22px)' }}
    >
      <motion.div
        initial={false}
        animate={
          visible
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.94, y: 8 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.32, delay: reducedMotion ? 0 : 0.58, ease }}
      >
        <div className="relative max-w-[11rem] rounded-lg border border-line bg-surface px-3 py-2.5 shadow-raised sm:max-w-[12.5rem]">
          <p className="text-xs leading-relaxed text-secondary">“Trocar o CTA aqui”</p>
          <span className="absolute -right-1.5 top-3 h-2.5 w-2.5 rotate-45 border-b border-r border-line bg-surface" />
        </div>
      </motion.div>
    </div>
  )
}

function VersionGhost({
  visible,
  reducedMotion,
}: {
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[8%] top-[18%] z-0 w-[58%] sm:left-[10%] sm:w-[52%]"
      style={{ transform: 'translateZ(-18px) rotate(-3deg)' }}
    >
      <motion.div
        initial={false}
        animate={
          visible
            ? { opacity: 0.55, x: 0, y: 0 }
            : { opacity: 0, x: -8, y: 6 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.36, delay: reducedMotion ? 0 : 0.68, ease }}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-surface-secondary shadow-soft">
          <div className="flex items-center justify-between border-b border-line/70 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-muted">V2</span>
            <span className="text-[9px] text-muted">Anterior</span>
          </div>
          <div className="relative h-16 bg-[#12171d] sm:h-20">
            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full border-[12px] border-brand/25" />
            <p className="absolute bottom-2 left-2 text-[9px] font-semibold tracking-[-0.04em] text-ink/50">
              FORMA
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function MaterialCard({
  visible,
  reducedMotion,
  pinActive,
}: {
  visible: boolean
  reducedMotion: boolean
  pinActive: boolean
}) {
  return (
    <div className="relative z-10 mx-auto w-[min(100%,17.5rem)] sm:w-[19rem]" style={{ transform: 'translateZ(0)' }}>
      <motion.article
        className="overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
        initial={false}
        animate={
          visible
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 16, scale: 0.97 }
        }
        transition={{ duration: reducedMotion ? 0 : 0.4, ease }}
      >
        <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Campanha verão
            </p>
            <p className="truncate text-xs font-semibold text-ink">Post principal</p>
          </div>
          <span className="rounded-sm border border-brand bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
            V3
          </span>
        </header>
        <div className="relative aspect-[5/4] overflow-hidden bg-surface-secondary surface-grid">
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[18px] border-brand/75"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-8 -left-6 h-24 w-24 rotate-12 border-[14px] border-revision/65"
          />
          <div className="absolute left-[9%] top-[12%] text-[8px] font-semibold uppercase tracking-[0.16em] text-brand">
            Estúdio Viztto
          </div>
          <div className="absolute inset-x-[9%] top-[32%]">
            <p className="text-[1.55rem] font-semibold leading-[0.82] tracking-[-0.06em] text-ink sm:text-[1.75rem]">
              FORMA
              <br />
              <span className="font-serif font-normal italic text-brand">em movimento</span>
            </p>
          </div>
          <motion.span
            aria-hidden="true"
            className={cn(
              'absolute right-[28%] top-[42%] grid h-6 w-6 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-contrast shadow-soft',
              pinActive && 'ring-4 ring-brand/25',
            )}
            initial={false}
            animate={{ scale: pinActive ? 1.05 : 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, delay: reducedMotion ? 0 : 0.58 }}
          >
            1
            <span className="absolute -bottom-0.5 h-1.5 w-1.5 rotate-45 bg-brand" />
          </motion.span>
        </div>
      </motion.article>
    </div>
  )
}

export function ProblemFeedbackScene() {
  const reducedMotion = Boolean(useReducedMotion())
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { amount: 0.35, once: true })
  const active = reducedMotion || inView
  const [floatReady, setFloatReady] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion || !active) return
    const timer = window.setTimeout(() => setFloatReady(true), ENTRANCE_MS)
    return () => window.clearTimeout(timer)
  }, [active, reducedMotion])

  return (
    <div
      ref={root}
      role="img"
      aria-label="Ilustração de feedback espalhado: mensagem, áudio, arquivo e comentário desconectados do material em revisão"
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
    >
      <div className="relative min-h-[22rem] overflow-hidden rounded-xl border border-line-subtle bg-background/80 p-3 sm:min-h-[24rem] sm:p-4 lg:[perspective:900px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 surface-grid opacity-25"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-revision/[0.06] blur-[70px]"
        />

        <motion.div
          className="relative h-full min-h-[20.5rem] sm:min-h-[22rem]"
          style={{ transformStyle: 'preserve-3d' }}
          initial={false}
          animate={floatReady && !reducedMotion ? { y: [0, -3, 0] } : { y: 0 }}
          transition={
            floatReady && !reducedMotion
              ? { duration: 7.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0 }
          }
        >
          <VersionGhost visible={active} reducedMotion={reducedMotion} />

          <div className="relative flex h-full min-h-[20.5rem] items-center justify-center pt-8 sm:min-h-[22rem] sm:pt-6">
            <MaterialCard
              visible={active}
              reducedMotion={reducedMotion}
              pinActive={active && !reducedMotion}
            />
          </div>

          <FeedbackMessage visible={active} reducedMotion={reducedMotion} />
          <FeedbackAudio visible={active} reducedMotion={reducedMotion} />
          <div className="hidden sm:block">
            <FeedbackFile visible={active} reducedMotion={reducedMotion} />
          </div>
          <FeedbackComment visible={active} reducedMotion={reducedMotion} />
        </motion.div>
      </div>
    </div>
  )
}
