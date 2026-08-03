import {
  Bell,
  Check,
  Clock3,
  Eye,
  FileImage,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Play,
  Send,
  Upload,
} from 'lucide-react'
import {
  ApprovalStamp,
  CollaborativeCursor,
  CommentCard,
  CommentPin,
  HistoryLine,
  StatusBadge,
  VersionBadge,
} from '@/components/feedback/FeedbackComponents'
import { Avatar, AvatarGroup, Badge, Card } from '@/components/ui/DataDisplay'
import { IconButton } from '@/components/ui/Button'
import { ShowcaseSection } from './Showcase'

export function ProductSections() {
  return (
    <>
      <ShowcaseSection id="estados" index="08" title="Badges e aprovação">
        <div className="grid gap-7">
          <div className="flex flex-wrap gap-2">
            <Badge>Feedback</Badge>
            <Badge tone="brand">Em revisão</Badge>
            <Badge tone="approval">Resolvido</Badge>
            <Badge tone="revision">Prioridade</Badge>
            <Badge tone="warning">Pendente</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="approved" />
            <StatusBadge status="waiting" />
            <StatusBadge status="changes" />
            <StatusBadge status="resolved" />
          </div>
          <div className="flex flex-wrap gap-8 pt-3">
            <ApprovalStamp />
            <ApprovalStamp status="changes" />
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="comentarios" index="09" title="Comentários contextuais">
        <div className="grid gap-7 xl:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-secondary p-6 surface-grid">
            <p className="eyebrow mb-8">Pins · estados</p>
            <div className="flex flex-wrap gap-8">
              <CommentPin number={1} />
              <CommentPin number={2} state="active" />
              <CommentPin number={3} state="resolved" />
              <CommentPin number={4} state="pending" />
            </div>
          </div>
          <CommentCard />
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="cursores" index="10" title="Presença colaborativa">
        <div className="relative min-h-64 overflow-hidden rounded-lg border border-line bg-surface p-6 surface-grid">
          <div className="h-full rounded-md border border-dashed border-line-strong p-5">
            <p className="text-sm font-semibold">Identidade visual · página 04</p>
            <p className="mt-1 text-xs text-muted">Duas pessoas visualizando agora</p>
          </div>
          <CollaborativeCursor name="Marina" className="absolute left-[18%] top-[44%]" />
          <CollaborativeCursor
            name="Rafael"
            color="revision"
            className="absolute right-[20%] top-[28%]"
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="versoes" index="11" title="Versões e histórico">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <p className="eyebrow mb-5">Controle de versões</p>
            <div className="flex flex-wrap gap-2">
              <VersionBadge>v1</VersionBadge>
              <VersionBadge>v2</VersionBadge>
              <VersionBadge current>v3 · atual</VersionBadge>
              <VersionBadge approved>Versão aprovada</VersionBadge>
            </div>
            <div className="mt-7 space-y-3">
              {['v3 · Ajustes de tipografia', 'v2 · Nova composição', 'v1 · Primeiro envio'].map(
                (v, i) => (
                  <div
                    key={v}
                    className="flex items-center justify-between border-t border-line pt-3 text-sm"
                  >
                    <span className={i === 0 ? 'font-semibold' : ''}>{v}</span>
                    <span className="text-xs text-muted">{i === 0 ? 'Hoje' : 'Ontem'}</span>
                  </div>
                ),
              )}
            </div>
          </Card>
          <Card>
            <p className="eyebrow mb-5">Linha de histórico</p>
            <HistoryLine />
          </Card>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="pessoas" index="12" title="Avatares e cartões">
        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Participantes</p>
                <p className="mt-1 text-sm text-secondary">4 pessoas nesta revisão</p>
              </div>
              <AvatarGroup names={['Marina Costa', 'Rafael Lima', 'Bianca Alves', 'Caio Melo']} />
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <Avatar name="Marina Costa" color="bg-revision" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Marina Costa</p>
              <p className="truncate text-xs text-muted">Direção de criação</p>
            </div>
            <IconButton label="Mais opções" className="border-0">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          </Card>
        </div>
      </ShowcaseSection>
      <ShowcaseSection
        id="icones"
        index="13"
        title="Ícones"
        note="Lucide em traço consistente, sem preencher a interface."
      >
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
          {[MessageSquare, Check, Clock3, Upload, Send, FileImage, Play, Eye, Link2, Bell].map(
            (Icon, i) => (
              <div
                key={i}
                className="grid aspect-square place-items-center rounded-md border border-line bg-surface"
              >
                <Icon className="h-5 w-5" />
              </div>
            ),
          )}
        </div>
      </ShowcaseSection>
    </>
  )
}
