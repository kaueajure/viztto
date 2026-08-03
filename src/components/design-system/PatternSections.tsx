import { Archive, FileImage, MoreHorizontal, Send } from 'lucide-react'
import { useState } from 'react'
import {
  ApprovalStamp,
  CommentCard,
  CommentPin,
  StatusBadge,
  VersionBadge,
} from '@/components/feedback/FeedbackComponents'
import { Button, IconButton } from '@/components/ui/Button'
import {
  Breadcrumb,
  Card,
  Divider,
  EmptyState,
  LoadingSkeleton,
  Progress,
} from '@/components/ui/DataDisplay'
import { Modal, Toast } from '@/components/ui/Interactive'
import { ShowcaseSection } from './Showcase'

export function PatternSections() {
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState(false)
  return (
    <>
      <ShowcaseSection id="feedback" index="14" title="Feedback de sistema">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setModal(true)}>
            Abrir modal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setToast(true)
              setTimeout(() => setToast(false), 3600)
            }}
          >
            Mostrar toast
          </Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Publicar nova versão?">
          <p className="text-sm leading-relaxed text-secondary">
            Os participantes serão notificados e a versão anterior permanecerá no histórico.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button icon={<Send className="h-4 w-4" />} onClick={() => setModal(false)}>
              Publicar versão
            </Button>
          </div>
        </Modal>
        <Toast open={toast} onClose={() => setToast(false)} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card>
            <p className="eyebrow mb-5">Skeleton</p>
            <div className="flex gap-3">
              <LoadingSkeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="w-2/5" />
                <LoadingSkeleton className="w-4/5" />
                <LoadingSkeleton className="w-3/5" />
              </div>
            </div>
          </Card>
          <Card>
            <p className="eyebrow mb-5">Progresso do upload</p>
            <Progress value={68} label="Vídeo institucional.mp4" />
          </Card>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="vazios" index="15" title="Estados vazios">
        <EmptyState
          title="Nenhum material enviado"
          description="Envie a primeira peça da Campanha de agosto para iniciar a revisão."
          icon={Archive}
        />
      </ShowcaseSection>
      <ShowcaseSection
        id="combinacoes"
        index="16"
        title="Combinações"
        note="Um recorte de interface demonstra como o sistema se comporta em contexto."
      >
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4 sm:p-5">
            <div>
              <Breadcrumb items={['Campanhas', 'Agosto', 'Identidade visual']} />
              <div className="mt-2 flex items-center gap-2">
                <h3 className="font-semibold">Identidade visual</h3>
                <VersionBadge current>v3</VersionBadge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="waiting" />
              <IconButton label="Mais opções">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <div className="grid lg:grid-cols-[1fr_340px]">
            <div className="relative min-h-[390px] overflow-hidden bg-surface-secondary p-6 surface-grid">
              <div className="mx-auto flex min-h-80 max-w-lg items-center justify-center rounded-md bg-brand text-center text-white shadow-raised">
                <div>
                  <FileImage className="mx-auto mb-4 h-8 w-8 opacity-65" />
                  <p className="text-2xl font-semibold tracking-tight">
                    Campanha
                    <br />
                    <span className="font-serif font-normal italic">de agosto</span>
                  </p>
                </div>
              </div>
              <div className="absolute left-[42%] top-[36%]">
                <CommentPin number={2} state="active" />
              </div>
              <div className="absolute bottom-9 right-8">
                <ApprovalStamp />
              </div>
            </div>
            <aside className="border-t border-line p-4 lg:border-l lg:border-t-0">
              <p className="eyebrow mb-4">Discussão selecionada</p>
              <CommentCard compact />
              <Divider label="1 resposta" />
              <p className="mt-4 text-xs leading-relaxed text-secondary">
                O comentário permanece preso ao ponto correto mesmo quando uma nova versão é
                publicada.
              </p>
            </aside>
          </div>
        </div>
      </ShowcaseSection>
    </>
  )
}
