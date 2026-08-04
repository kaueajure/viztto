import {
  CalendarDays,
  Check,
  Code2,
  Film,
  FolderKanban,
  LayoutGrid,
  Megaphone,
  Play,
} from 'lucide-react'
import { CommentPin, StatusBadge, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { AvatarGroup, Progress } from '@/components/ui/DataDisplay'
import type { AudienceId } from '@/data/audiences'

export function AudiencePreview({ audience }: { audience: AudienceId }) {
  return (
    <div
      className="relative min-h-[22rem] overflow-hidden rounded-xl border border-line bg-surface-elevated p-4 shadow-soft sm:p-5"
      role="group"
      aria-label={labels[audience]}
    >
      <div className="surface-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icons[audience]} {titles[audience]}
        </div>
        <AvatarGroup names={['Marina', 'Rafael', 'Bianca']} />
      </div>
      <div className="relative mt-4 min-h-[16rem]">{visuals[audience]}</div>
    </div>
  )
}

const visuals: Record<AudienceId, React.ReactNode> = {
  agencies: (
    <div className="grid grid-cols-2 gap-3">
      {['Aurora', 'Lume', 'Norte', 'Origem'].map((client, index) => (
        <div key={client} className="rounded-md border border-line bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-brand-soft text-xs font-bold text-brand">
              {client[0]}
            </span>
            <span className="text-[10px] text-muted">{index + 2} projetos</span>
          </div>
          <p className="mt-3 text-sm font-semibold">{client}</p>
          <p className="mt-1 text-xs text-secondary">Campanha de agosto</p>
          <div className="mt-3 h-1.5 rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${48 + index * 12}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  social: (
    <div className="grid grid-cols-5 gap-2">
      {['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((day, index) => (
        <div
          key={day}
          className="min-h-48 rounded-md border border-line bg-surface p-2 text-center"
        >
          <p className="text-[9px] font-semibold text-muted">{day}</p>
          {index !== 1 && (
            <div className="mt-3 aspect-square rounded-sm bg-revision p-1 text-left text-[8px] font-semibold text-background">
              POST
              <br />
              {index + 1}
            </div>
          )}
          {index === 1 && (
            <div className="mt-12 rounded-sm border border-dashed border-line-strong py-2 text-[8px] text-muted">
              Livre
            </div>
          )}
          {index === 3 && (
            <span className="mt-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-approval text-[8px] text-brand-contrast">
              <Check className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      ))}
    </div>
  ),
  design: (
    <div className="relative min-h-64 overflow-hidden rounded-lg bg-warning p-5 text-brand-contrast">
      <div className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-accent" />
      <p className="relative max-w-[13rem] font-serif text-4xl leading-[0.92]">
        Uma campanha que chama atenção.
      </p>
      <div className="absolute left-[63%] top-[28%]">
        <CommentPin number={1} state="active" interactive={false} />
      </div>
      <div className="absolute bottom-[18%] left-[28%]">
        <CommentPin number={2} state="resolved" interactive={false} />
      </div>
      <div className="absolute bottom-4 right-4 rounded-sm bg-background px-2 py-1 text-[10px] text-ink">
        v3 · comparação ativa
      </div>
    </div>
  ),
  video: (
    <div className="overflow-hidden rounded-lg border border-line bg-background">
      <div className="relative grid min-h-44 place-items-center bg-[#151b23]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-brand-contrast">
          <Play className="ml-0.5 h-5 w-5" />
        </span>
        <div className="absolute bottom-3 left-3 rounded-sm bg-background/90 px-2 py-1 text-xs">
          00:38 / 01:24
        </div>
      </div>
      <div className="p-3">
        <div className="relative h-7 border-b border-line">
          <span className="absolute left-[45%] top-0 h-full w-px bg-revision" />
          <span className="absolute left-[43%] top-0 rounded-sm bg-revision px-1.5 text-[9px] text-background">
            00:38
          </span>
        </div>
        <p className="mt-3 text-xs text-secondary">
          “A transição pode começar dois segundos antes.”
        </p>
      </div>
    </div>
  ),
  web: (
    <div className="overflow-hidden rounded-lg border border-line bg-background">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-revision" />
        <span className="h-2 w-2 rounded-full bg-warning" />
        <span className="h-2 w-2 rounded-full bg-approval" />
        <span className="ml-2 h-5 flex-1 rounded-sm bg-surface text-center text-[8px] leading-5 text-muted">
          campanha.viztto.site
        </span>
      </div>
      <div className="relative grid min-h-52 grid-cols-[1fr_0.65fr] gap-4 p-5">
        <div>
          <div className="h-3 w-16 rounded bg-brand" />
          <div className="mt-4 h-8 w-full rounded bg-surface-elevated" />
          <div className="mt-2 h-8 w-4/5 rounded bg-surface-elevated" />
          <div className="mt-4 h-6 w-24 rounded bg-brand" />
        </div>
        <div className="rounded-md bg-revision" />
        <div className="absolute right-[28%] top-[38%]">
          <CommentPin number={3} state="pending" interactive={false} />
        </div>
      </div>
    </div>
  ),
  marketing: (
    <div className="grid gap-3">
      <div className="rounded-md border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Campanha institucional</p>
            <p className="mt-1 font-semibold">Apresentação comercial</p>
          </div>
          <StatusBadge status="waiting" />
        </div>
        <div className="mt-4">
          <Progress value={75} label="3 de 4 aprovações" />
        </div>
      </div>
      {['Criação · concluído', 'Liderança · aprovado', 'Comercial · revisando'].map(
        (item, index) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 text-sm"
          >
            <span>{item}</span>
            <VersionBadge current={index === 2} approved={index < 2}>
              v4
            </VersionBadge>
          </div>
        ),
      )}
    </div>
  ),
}

const icons: Record<AudienceId, React.ReactNode> = {
  agencies: <FolderKanban className="h-4 w-4 text-brand" />,
  social: <CalendarDays className="h-4 w-4 text-brand" />,
  design: <LayoutGrid className="h-4 w-4 text-brand" />,
  video: <Film className="h-4 w-4 text-brand" />,
  web: <Code2 className="h-4 w-4 text-brand" />,
  marketing: <Megaphone className="h-4 w-4 text-brand" />,
}

const titles: Record<AudienceId, string> = {
  agencies: 'Projetos por cliente',
  social: 'Calendário editorial',
  design: 'Revisão da arte',
  video: 'Vídeo institucional',
  web: 'Página em revisão',
  marketing: 'Fluxo de aprovação',
}
const labels: Record<AudienceId, string> = {
  agencies: 'Projetos organizados em espaços separados para cada cliente.',
  social: 'Calendário de conteúdos com status de aprovação por publicação.',
  design: 'Arte com comentários visuais posicionados diretamente sobre o material.',
  video: 'Comentário vinculado ao segundo trinta e oito de um vídeo.',
  web: 'Página de site com um comentário vinculado a um componente.',
  marketing: 'Fluxo de aprovação entre criação, liderança e comercial.',
}
