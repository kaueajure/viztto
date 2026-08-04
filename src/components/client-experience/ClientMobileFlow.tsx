import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Link2, MessageSquareText, Send, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { ApprovalStamp, CommentPin, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { cn } from '@/lib/cn'

const steps = [
  { label: 'Recebe o link', icon: Link2 },
  { label: 'Abre a revisão', icon: Smartphone },
  { label: 'Comenta', icon: MessageSquareText },
  { label: 'Aprova', icon: Check },
]

export function ClientMobileFlow() {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()

  return (
    <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
      <div className="grid gap-2" role="group" aria-label="Etapas da experiência do cliente">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <button
              key={step.label}
              type="button"
              aria-pressed={active === index}
              onClick={() => setActive(index)}
              className={cn(
                'flex min-h-14 items-center gap-4 rounded-md border px-4 text-left text-sm font-semibold transition-colors',
                active === index
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line bg-surface text-secondary hover:border-line-strong hover:text-ink',
              )}
            >
              <span className="font-serif text-lg">0{index + 1}</span>
              <Icon className="h-4 w-4" />
              {step.label}
            </button>
          )
        })}
      </div>

      <div className="relative mx-auto w-full max-w-[23rem] rounded-[2rem] border border-line-strong bg-background p-2 shadow-raised">
        <div className="mx-auto mb-2 h-1.5 w-20 rounded-full bg-line" aria-hidden />
        <div className="min-h-[36rem] overflow-hidden rounded-[1.5rem] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs">
            <span className="font-semibold">Viztto</span>
            <span className="text-muted">Cliente</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={reduceMotion ? false : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <PhoneScreen step={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function PhoneScreen({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="pt-14">
        <div className="ml-auto max-w-[90%] rounded-lg rounded-br-sm bg-brand p-4 text-sm text-brand-contrast shadow-soft">
          <p>Olá, Marina! A campanha está pronta para revisão.</p>
          <div className="mt-3 flex items-center gap-2 rounded-md bg-brand-contrast/10 px-3 py-2">
            <Link2 className="h-4 w-4" />
            <span className="truncate">viztto.link/campanha</span>
          </div>
          <p className="mt-2 text-right text-[10px] opacity-70">14:08</p>
        </div>
        <p className="mt-8 text-center text-xs text-muted">O link abre diretamente no navegador.</p>
      </div>
    )
  if (step === 1)
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Campanha de agosto</p>
            <p className="font-semibold">Post principal</p>
          </div>
          <VersionBadge current>v4</VersionBadge>
        </div>
        <div className="relative mt-4 min-h-80 overflow-hidden rounded-lg bg-revision p-5 text-background">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[28px] border-brand" />
          <p className="relative font-serif text-4xl leading-none">
            Ideias
            <br />
            no lugar certo.
          </p>
          <div className="absolute left-[62%] top-[38%]">
            <CommentPin number={1} state="active" interactive={false} />
          </div>
        </div>
        <span className="mt-4 grid min-h-11 w-full place-items-center rounded-md bg-brand text-sm font-semibold text-brand-contrast">
          Aprovar versão
        </span>
      </div>
    )
  if (step === 2)
    return (
      <div>
        <div className="relative min-h-64 overflow-hidden rounded-lg bg-warning p-5 text-brand-contrast">
          <p className="font-serif text-4xl leading-none">
            Campanha
            <br />
            em revisão.
          </p>
          <div className="absolute bottom-[28%] right-[22%]">
            <CommentPin number={2} state="pending" interactive={false} />
          </div>
        </div>
        <div className="mt-4 rounded-md border border-line bg-surface-elevated p-4">
          <p className="text-xs font-semibold text-revision">Comentário no ponto 2</p>
          <p className="mt-2 text-sm text-secondary">Podemos usar a imagem da versão anterior?</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted">Marina · agora</span>
            <Send className="h-4 w-4 text-brand" />
          </div>
        </div>
      </div>
    )
  return (
    <div className="grid min-h-[31rem] place-items-center text-center">
      <div>
        <ApprovalStamp />
        <p className="mt-7 text-xl font-semibold">Versão aprovada</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          A decisão foi registrada para a versão 4.
        </p>
        <div className="mt-6 rounded-md border border-approval/25 bg-approval-soft p-4 text-sm text-approval">
          <Check className="mx-auto mb-2 h-5 w-5" />
          Aprovado por Marina
          <br />
          <span className="text-xs text-secondary">Hoje, 14:16</span>
        </div>
      </div>
    </div>
  )
}
