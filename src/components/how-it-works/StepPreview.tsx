import {
  CalendarCheck2,
  Check,
  Clock3,
  Copy,
  FileImage,
  Link2,
  LockKeyhole,
  MessageSquareText,
  UploadCloud,
  UserRoundCheck,
} from 'lucide-react'
import {
  ApprovalStamp,
  CollaborativeCursor,
  CommentPin,
  StatusBadge,
  VersionBadge,
} from '@/components/feedback/FeedbackComponents'
import { Avatar, Progress } from '@/components/ui/DataDisplay'
import type { HowItWorksStepId } from '@/data/howItWorks'

export function StepPreview({ step }: { step: HowItWorksStepId }) {
  return (
    <div
      className="relative min-h-[30rem] w-full min-w-0 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-raised sm:p-6"
      role="img"
      aria-label={previewLabels[step]}
    >
      <div className="surface-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative h-full">{previews[step]}</div>
    </div>
  )
}

const Frame = ({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
  children: React.ReactNode
}) => (
  <div className="mx-auto flex min-h-[26rem] w-full min-w-0 max-w-xl flex-col rounded-lg border border-line bg-surface-elevated shadow-soft">
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft text-brand">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>
        <p className="text-sm font-semibold">{title}</p>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
  </div>
)

const previews: Record<HowItWorksStepId, React.ReactNode> = {
  upload: (
    <Frame
      icon={<UploadCloud className="h-4 w-4" />}
      eyebrow="Novo material"
      title="Campanha de agosto"
    >
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line-strong bg-background/50 p-5 text-center">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
            <FileImage className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-semibold">campanha-carrossel.png</p>
          <p className="mt-1 text-xs text-muted">Imagem · 4,8 MB</p>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-line bg-surface p-4">
        <Progress value={100} label="Envio concluído" />
        <div className="mt-3 flex items-center justify-between text-xs text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-approval" /> Primeira versão criada
          </span>
          <VersionBadge current>v1</VersionBadge>
        </div>
      </div>
    </Frame>
  ),
  share: (
    <Frame icon={<Link2 className="h-4 w-4" />} eyebrow="Compartilhamento" title="Link de revisão">
      <div className="rounded-lg border border-line bg-background/55 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Acesso do cliente
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm text-secondary">
            viztto.link/campanha-agosto
          </span>
          <Copy className="h-4 w-4 shrink-0 text-brand" />
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-3">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-secondary" /> Proteção por senha
            </span>
            <span className="h-5 w-9 rounded-full bg-brand p-0.5">
              <span className="ml-auto block h-4 w-4 rounded-full bg-brand-contrast" />
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-approval/30 bg-approval-soft px-3 py-3 text-approval">
            <UserRoundCheck className="h-4 w-4" />
            <span>Cliente acessou a revisão</span>
          </div>
        </div>
      </div>
      <p className="mt-auto pt-4 text-center text-xs text-muted">
        Sem instalação · conta opcional para quem revisa
      </p>
    </Frame>
  ),
  review: (
    <Frame
      icon={<MessageSquareText className="h-4 w-4" />}
      eyebrow="Revisão em andamento"
      title="Post principal · v3"
    >
      <div className="relative min-h-52 flex-1 overflow-hidden rounded-lg border border-line bg-[#ff6b57] p-5">
        <div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[20px] border-[#0d1117]/90"
          aria-hidden
        />
        <p className="max-w-[12rem] font-serif text-3xl leading-none text-[#0d1117]">
          Ideias que ganham forma.
        </p>
        <div className="absolute left-[60%] top-[22%]">
          <CommentPin number={1} state="active" />
        </div>
        <div className="absolute bottom-[16%] left-[25%]">
          <CommentPin number={2} state="resolved" />
        </div>
        <CollaborativeCursor name="Marina" className="absolute left-[48%] top-[38%]" />
      </div>
      <div className="mt-3 rounded-md border border-line bg-surface p-3 text-sm">
        <div className="flex items-center gap-2">
          <Avatar name="Marina" color="bg-revision text-background" />
          <div>
            <p className="font-semibold">Marina</p>
            <p className="text-xs text-muted">Comentário em v3</p>
          </div>
        </div>
        <p className="mt-2 text-secondary">Podemos aumentar o contraste deste título?</p>
      </div>
    </Frame>
  ),
  approve: (
    <Frame
      icon={<CalendarCheck2 className="h-4 w-4" />}
      eyebrow="Decisão registrada"
      title="Campanha de agosto"
    >
      <div className="grid flex-1 place-items-center rounded-lg border border-approval/25 bg-approval-soft/60 p-6 text-center">
        <div>
          <ApprovalStamp />
          <p className="mt-5 font-semibold">Versão 4 aprovada</p>
          <p className="mt-1 text-sm text-secondary">por Marina Costa · hoje, 14:32</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 rounded-md border border-line bg-surface p-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-secondary">
            <Clock3 className="h-3.5 w-3.5" /> Histórico atualizado
          </span>
          <StatusBadge status="approved" />
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-muted">Versão escolhida</span>
          <VersionBadge approved>v4</VersionBadge>
        </div>
      </div>
    </Frame>
  ),
}

const previewLabels: Record<HowItWorksStepId, string> = {
  upload: 'Envio de um material criando automaticamente a primeira versão.',
  share: 'Geração de um link seguro para o cliente revisar sem criar conta.',
  review: 'Comentário posicionado diretamente sobre uma peça criativa.',
  approve: 'Aprovação da versão quatro registrada com pessoa, data e histórico.',
}
