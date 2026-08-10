import { Check, MessageSquare, PanelRight, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ActivityPanel } from '@/components/review/ActivityPanel'
import { CommentsPanel } from '@/components/review/CommentsPanel'
import { ImageReviewCanvas } from '@/components/review/ImageReviewCanvas'
import { MaterialApprovalsProgress } from '@/components/review/MaterialApprovalsProgress'
import { MaterialPreview, type MaterialPreviewHandle } from '@/components/review/MaterialPreview'
import { PdfReviewCanvas } from '@/components/review/PdfReviewCanvas'
import { NewVersionModal } from '@/components/review/NewVersionModal'
import { ReviewDecisionModal } from '@/components/review/ReviewDecisionModal'
import { ReviewToolbar } from '@/components/review/ReviewToolbar'
import { VersionsPanel } from '@/components/review/VersionsPanel'
import { VersionComparison } from '@/components/features/VersionComparison'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/DataDisplay'
import { Textarea } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'
import { useAppData } from '@/contexts/AppDataContext'
import { cn } from '@/lib/cn'
import { formatVideoTimestamp } from '@/lib/formatVideoTimestamp'
import { materialTypeLabel } from '@/lib/materialType'

type Panel = 'comments' | 'versions' | 'activity' | 'info'
type DraftComment = {
  x: number
  y: number
  timestampSeconds?: number
  pdfPage?: number
}

export default function ReviewWorkspacePage() {
  const { materialId } = useParams()
  const data = useAppData()
  const material = data.materials.find((item) => item.id === materialId)
  const project = data.projects.find((item) => item.id === material?.projectId)
  const client = data.clients.find((item) => item.id === project?.clientId)
  const versions = useMemo(
    () => data.materialVersions.filter((item) => item.materialId === materialId),
    [data.materialVersions, materialId],
  )
  const [activeVersionId, setActiveVersionId] = useState(material?.currentVersionId ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('comments')
  const [mobilePanel, setMobilePanel] = useState(false)
  const [creationMode, setCreationMode] = useState(false)
  const [draft, setDraft] = useState<DraftComment | null>(null)
  const [draftText, setDraftText] = useState('')
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<MaterialPreviewHandle>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [pdfPage, setPdfPage] = useState(1)
  const [seekSeconds, setSeekSeconds] = useState<number | null>(null)
  const [seekToken, setSeekToken] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [newVersion, setNewVersion] = useState(false)
  const [decision, setDecision] = useState<'changes' | 'approve' | null>(null)
  const [compare, setCompare] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (material?.currentVersionId && !versions.some((item) => item.id === activeVersionId)) {
      setActiveVersionId(material.currentVersionId)
    }
  }, [material?.currentVersionId, activeVersionId, versions])
  useEffect(() => {
    if (draft) requestAnimationFrame(() => draftRef.current?.focus())
  }, [draft])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input,textarea,select,[contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        setCreationMode(true)
        setDraft(null)
      }
      if (event.key === 'Escape') {
        setCreationMode(false)
        setDraft(null)
        setDraftText('')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!material)
    return (
      <EmptyState
        title="Material não encontrado"
        description="O material solicitado não está disponível."
      />
    )
  const activeVersion = versions.find((item) => item.id === activeVersionId) ?? versions[0]
  if (!activeVersion)
    return (
      <EmptyState
        title="Versão não encontrada"
        description="Não existe uma versão disponível para este material."
      />
    )
  const materialComments = data.comments.filter((item) => item.materialId === material.id)
  const activeComments = materialComments.filter((item) => item.versionId === activeVersion.id)
  const openCurrent = data.comments.filter(
    (item) =>
      item.materialId === material.id &&
      item.versionId === material.currentVersionId &&
      item.status === 'open',
  ).length
  const materialActivities = data.activities.filter((item) => item.materialId === material.id)
  const sortedVersions = [...versions].sort((a, b) => a.number - b.number)
  const activeIndex = sortedVersions.findIndex((item) => item.id === activeVersion.id)
  const compareBefore = sortedVersions[Math.max(0, activeIndex - 1)]

  const selectComment = (commentId: string) => {
    setSelectedId(commentId)
    setPanel('comments')
    const comment = data.comments.find((item) => item.id === commentId)
    if (comment?.timestampSeconds != null) {
      setSeekSeconds(comment.timestampSeconds)
      setSeekToken((atual) => atual + 1)
    }
    if (comment?.pdfPage != null) {
      setPdfPage(comment.pdfPage)
    }
  }
  const panelContent =
    panel === 'comments' ? (
      <CommentsPanel
        comments={materialComments}
        versions={versions}
        activeVersionId={activeVersion.id}
        selectedId={selectedId}
        onSelect={(comment) => {
          setActiveVersionId(comment.versionId)
          selectComment(comment.id)
        }}
        onReply={data.addCommentReply}
        onResolve={data.resolveComment}
        onReopen={data.reopenComment}
        onEdit={data.updateComment}
        onDelete={(id) => {
          data.deleteComment(id)
          if (selectedId === id) setSelectedId(null)
        }}
      />
    ) : panel === 'versions' ? (
      <VersionsPanel
        versions={versions}
        activeId={activeVersion.id}
        currentId={material.currentVersionId}
        onSelect={(id) => {
          setActiveVersionId(id)
          setSelectedId(null)
        }}
        onNewVersion={() => setNewVersion(true)}
        onCompare={() => setCompare(true)}
      />
    ) : panel === 'activity' ? (
      <ActivityPanel
        activities={materialActivities}
        onSelectComment={(commentId) => {
          const comment = data.comments.find((item) => item.id === commentId)
          if (comment) setActiveVersionId(comment.versionId)
          selectComment(commentId)
        }}
      />
    ) : (
      <section className="p-4">
        <h2 className="font-semibold">Informações</h2>
        <div className="mt-4">
          <MaterialApprovalsProgress
            materialId={material.id}
            refreshKey={`${material.status}-${material.updatedAt}-${activeVersion.id}`}
          />
        </div>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-muted">Cliente</dt>
            <dd className="mt-1 font-medium">{client?.name ?? 'Cliente'}</dd>
          </div>
          <div>
            <dt className="text-muted">Projeto</dt>
            <dd className="mt-1 font-medium">{project?.name ?? 'Projeto'}</dd>
          </div>
          <div>
            <dt className="text-muted">Formato</dt>
            <dd className="mt-1 font-medium">
              {materialTypeLabel(material.type)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Criado em</dt>
            <dd className="mt-1 font-medium">
              {new Date(material.createdAt).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
      </section>
    )

  const confirmRequest = async () => {
    if (activeVersion.id !== material.currentVersionId) return
    const changed = await data.requestChanges(material.id, activeVersion.id)
    setDecision(null)
    setNotice(
      changed
        ? { tone: 'success', text: 'Alterações solicitadas.' }
        : {
            tone: 'error',
            text: 'Adicione pelo menos um comentário pendente antes de solicitar alterações.',
          },
    )
  }
  const confirmApproval = async () => {
    if (activeVersion.id !== material.currentVersionId) return
    const resultado = await data.approveVersion(material.id, activeVersion.id)
    setDecision(null)
    if (!resultado.materialFinalizado) {
      const pendentes = resultado.aprovadoresPendentes
        .map((id) => data.team.find((membro) => membro.id === id)?.name)
        .filter((nome): nome is string => Boolean(nome))
      const contagem = `${resultado.aprovacoesRegistradas} de ${resultado.aprovadoresNecessarios} aprovações`
      const aguardando =
        pendentes.length === 1
          ? `Aguardando ${pendentes[0]}.`
          : 'Aguardando as demais aprovações.'
      setNotice({
        tone: 'success',
        text: `✓ Sua aprovação foi registrada. ${contagem}. ${aguardando}`,
      })
      return
    }
    setNotice({
      tone: 'success',
      text: `✓ Versão ${material.currentVersion} aprovada. Todas as aprovações necessárias foram registradas.`,
    })
  }

  return (
    <div className="-m-4 overflow-hidden rounded-lg border border-line bg-surface sm:-m-6 lg:-m-8">
      <ReviewToolbar
        client={client}
        project={project}
        material={material}
        activeVersion={activeVersion}
        zoom={zoom}
        creationMode={creationMode}
        onToggleCreation={() => {
          setCreationMode((value) => !value)
          setDraft(null)
          setDraftText('')
        }}
        onZoom={(value) => setZoom(Math.min(300, Math.max(25, value)))}
        onFit={() => setZoom(100)}
        onRequestChanges={() =>
          openCurrent
            ? setDecision('changes')
            : setNotice({
                tone: 'error',
                text: 'Adicione pelo menos um comentário pendente antes de solicitar alterações.',
              })
        }
        onApprove={() => setDecision('approve')}
        onReopen={() => {
          data.reopenReview(material.id)
          setNotice({ tone: 'success', text: 'Revisão reaberta sem remover a aprovação anterior.' })
        }}
        onReturnToCurrent={() => {
          setActiveVersionId(material.currentVersionId)
          setSelectedId(null)
        }}
        onOpenMobilePanel={() => setMobilePanel(true)}
      />
      {activeVersion.id !== material.currentVersionId && (
        <div
          role="status"
          className="border-b border-warning/30 bg-warning-soft px-4 py-2 text-center text-xs text-warning"
        >
          Você está visualizando a versão {activeVersion.number}. A versão atual é a{' '}
          {material.currentVersion}. As decisões ficam disponíveis apenas na versão atual.
          <button
            type="button"
            className="ml-2 min-h-8 font-semibold underline underline-offset-4"
            onClick={() => {
              setActiveVersionId(material.currentVersionId)
              setSelectedId(null)
            }}
          >
            Voltar para a versão atual
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className={cn(
            'flex items-center justify-between gap-3 border-b px-4 py-2 text-sm',
            notice.tone === 'success'
              ? 'border-approval/30 bg-approval-soft text-approval'
              : 'border-revision/30 bg-revision-soft text-revision',
          )}
        >
          <span>{notice.text}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="grid min-h-[calc(100svh-9rem)] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="relative flex min-h-0 flex-col">
          {material.type === 'image' ? (
            <ImageReviewCanvas
              imageUrl={activeVersion.imageUrl ?? ''}
              alt={material.name}
              comments={activeComments}
              selectedId={selectedId}
              creationMode={creationMode}
              zoom={zoom}
              draftPosition={draft}
              onPoint={(position) => {
                setDraft(position)
                setCreationMode(false)
              }}
              onSelect={selectComment}
            />
          ) : material.type === 'pdf' ? (
            <PdfReviewCanvas
              url={activeVersion.imageUrl ?? ''}
              page={pdfPage}
              comments={activeComments}
              selectedId={selectedId}
              creationMode={creationMode}
              zoom={zoom}
              draftPosition={draft}
              onPageChange={setPdfPage}
              onPoint={(position) => {
                setDraft(position)
                setPdfPage(position.pdfPage)
                setCreationMode(false)
              }}
              onSelect={selectComment}
            />
          ) : (
            <div className="relative grid min-h-[32rem] flex-1 place-items-center overflow-auto bg-[#090d12] p-4">
              {creationMode && (
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      const seconds = previewRef.current?.getCurrentTime() ?? currentTime
                      setDraft({ x: 0.5, y: 0.5, timestampSeconds: seconds })
                      setCreationMode(false)
                    }}
                  >
                    Comentar em {formatVideoTimestamp(currentTime)}
                  </Button>
                </div>
              )}
              <MaterialPreview
                ref={previewRef}
                type={material.type}
                url={activeVersion.imageUrl ?? ''}
                title={material.name}
                seekSeconds={seekSeconds}
                seekToken={seekToken}
                onTimeUpdate={setCurrentTime}
              />
            </div>
          )}
          {draft && (
            <form
              onSubmit={async (event) => {
                event.preventDefault()
                if (!draftText.trim()) return
                const comment = await data.addComment({
                  materialId: material.id,
                  versionId: activeVersion.id,
                  text: draftText,
                  x: draft.x,
                  y: draft.y,
                  timestampSeconds: draft.timestampSeconds,
                  pdfPage: draft.pdfPage,
                })
                setDraft(null)
                setDraftText('')
                setSelectedId(comment.id)
                setPanel('comments')
                setNotice({
                  tone: 'success',
                  text:
                    draft.timestampSeconds != null
                      ? `Comentário adicionado em ${formatVideoTimestamp(draft.timestampSeconds)}.`
                      : draft.pdfPage != null
                        ? `Comentário adicionado na página ${draft.pdfPage}.`
                        : 'Comentário adicionado ao ponto selecionado.',
                })
              }}
              className="absolute bottom-16 right-3 z-20 w-[min(24rem,calc(100%-1.5rem))] rounded-lg border border-brand/40 bg-surface-elevated p-4 shadow-raised"
            >
              {(draft.timestampSeconds != null || draft.pdfPage != null) && (
                <p className="mb-2 text-xs text-secondary">
                  {draft.timestampSeconds != null
                    ? `Timestamp: ${formatVideoTimestamp(draft.timestampSeconds)}`
                    : `Página ${draft.pdfPage} · ponto marcado`}
                </p>
              )}
              <Textarea
                ref={draftRef}
                label="Novo comentário"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                error={
                  draftText.length > 0 && !draftText.trim() ? 'Escreva um comentário.' : undefined
                }
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraft(null)
                    setDraftText('')
                    setCreationMode(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!draftText.trim()}>
                  Salvar comentário
                </Button>
              </div>
            </form>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-3 py-2 lg:hidden">
            <Button
              variant={creationMode ? 'primary' : 'secondary'}
              onClick={() => setCreationMode((value) => !value)}
            >
              <MessageSquare className="h-4 w-4" /> Comentar
            </Button>
            <div className="flex items-center gap-1">
              <IconButton label="Diminuir zoom" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                −
              </IconButton>
              <span className="min-w-12 text-center text-xs">{zoom}%</span>
              <IconButton label="Aumentar zoom" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                +
              </IconButton>
            </div>
            <IconButton label="Abrir painel" onClick={() => setMobilePanel(true)}>
              <PanelRight className="h-4 w-4" />
            </IconButton>
          </div>
        </main>
        <aside className="hidden min-h-0 border-l border-line bg-surface-elevated xl:flex xl:flex-col">
          <PanelTabs active={panel} onChange={setPanel} />
          <div className="min-h-0 flex-1">{panelContent}</div>
        </aside>
      </div>
      <Modal open={mobilePanel} onClose={() => setMobilePanel(false)} title="Painel da revisão">
        <div className="max-h-[70svh] overflow-y-auto">
          <PanelTabs active={panel} onChange={setPanel} />
          {panelContent}
          <div className="grid gap-2 border-t border-line p-4">
            <Button
              variant="secondary"
              onClick={() => {
                setMobilePanel(false)
                setCreationMode(true)
              }}
            >
              <MessageSquare className="h-4 w-4" /> Adicionar comentário
            </Button>
            {material.status === 'approved' ? (
              <Button
                onClick={() => {
                  data.reopenReview(material.id)
                  setMobilePanel(false)
                }}
              >
                <RotateCcw className="h-4 w-4" /> Reabrir revisão
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  disabled={activeVersion.id !== material.currentVersionId}
                  onClick={() => {
                    setMobilePanel(false)
                    if (openCurrent) setDecision('changes')
                    else
                      setNotice({
                        tone: 'error',
                        text: 'Adicione um comentário pendente antes de solicitar alterações.',
                      })
                  }}
                >
                  Solicitar alterações
                </Button>
                <Button
                  disabled={activeVersion.id !== material.currentVersionId}
                  onClick={() => {
                    setMobilePanel(false)
                    setDecision('approve')
                  }}
                >
                  <Check className="h-4 w-4" /> Aprovar versão
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
      <NewVersionModal
        open={newVersion}
        onClose={() => setNewVersion(false)}
        nextNumber={Math.max(...versions.map((item) => item.number)) + 1}
        materialType={material.type}
        onPublish={async (input) => {
          const version = await data.addMaterialVersion({ materialId: material.id, ...input })
          setActiveVersionId(version.id)
          setNewVersion(false)
          setNotice({ tone: 'success', text: `Versão ${version.number} publicada.` })
        }}
      />
      <ReviewDecisionModal
        mode={decision ?? 'approve'}
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        materialName={material.name}
        version={material.currentVersion}
        openComments={openCurrent}
        clientName={client?.name ?? 'Cliente'}
        onConfirm={decision === 'changes' ? confirmRequest : confirmApproval}
      />
      <Modal open={compare} onClose={() => setCompare(false)} title="Comparar versões">
        <VersionComparison
          beforeImage={compareBefore?.imageUrl}
          afterImage={activeVersion.imageUrl}
          beforeLabel={`v${compareBefore?.number ?? activeVersion.number}`}
          afterLabel={`v${activeVersion.number}`}
        />
      </Modal>
    </div>
  )
}

function PanelTabs({ active, onChange }: { active: Panel; onChange: (panel: Panel) => void }) {
  const items: Array<[Panel, string]> = [
    ['comments', 'Comentários'],
    ['versions', 'Versões'],
    ['activity', 'Atividade'],
    ['info', 'Info'],
  ]
  return (
    <div
      role="tablist"
      aria-label="Painéis da revisão"
      className="flex overflow-x-auto border-b border-line"
    >
      {items.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          className={cn(
            'min-h-11 flex-1 whitespace-nowrap px-3 text-xs font-semibold',
            active === value ? 'border-b-2 border-brand text-brand' : 'text-secondary',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
