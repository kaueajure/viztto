import { ArrowLeft, Check, CheckCircle2, MessageSquarePlus, Send, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ImageReviewCanvas } from '@/components/review/ImageReviewCanvas'
import { MaterialPreview } from '@/components/review/MaterialPreview'
import { PortalApprovalDialog } from '@/components/portal/PortalApprovalDialog'
import {
  PortalAccessBadge,
  PortalBrandIdentity,
  PortalBrandShell,
  type PortalBrand,
} from '@/components/portal/PortalBrand'
import {
  PORTAL_UNAVAILABLE_MESSAGE,
  PortalUnavailableState,
} from '@/components/portal/PortalUnavailableState'
import { Button, IconButton } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/FormControls'
import { caminhoPortalProjeto, comTokenPortal, UUID_RE } from '@/lib/portalPaths'
import { ApiError, json, requisicaoApi } from '@/services/api/clienteHttp'
import type { ReviewComment } from '@/types/domain'
import { cn } from '@/lib/cn'

type DetalhePortal = {
  projeto: {
    id: string
    nome: string
    empresaNome: string
    clienteNome: string
    workspaceSlug?: string
  }
  material: { id: string; nome: string; status: string; tipo: string }
  versao: {
    id: string
    numero: number
    nome: string
    arquivoId: string
    aprovada: boolean
    imagemUrl: string
  }
  marca?: PortalBrand
}

const rotuloStatus: Record<string, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  alteracoes_solicitadas: 'Alterações solicitadas',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
}

export default function PortalRevisaoPage() {
  const { workspaceSlug = '', projectId = '', materialId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const tokenPortal = searchParams.get('t')?.trim() || ''
  const [detalhe, setDetalhe] = useState<DetalhePortal | null>(null)
  const [comentarios, setComentarios] = useState<ReviewComment[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [creationMode, setCreationMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<
    'comentario' | 'alteracoes' | 'aprovacao' | null
  >(null)
  const [pendenciasParaConfirmar, setPendenciasParaConfirmar] = useState<number | null>(null)
  const [zoom, setZoom] = useState(100)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  const slugValido = Boolean(workspaceSlug) && UUID_RE.test(projectId) && UUID_RE.test(materialId)
  const voltarHref = caminhoPortalProjeto(workspaceSlug, projectId, tokenPortal)
  const caminhoMaterialApi = `/api/portal/projetos/${projectId}/materiais/${materialId}`
  const urlDetalhe = comTokenPortal(
    `${caminhoMaterialApi}?slug=${encodeURIComponent(workspaceSlug)}`,
    tokenPortal,
  )
  const urlComentarios = comTokenPortal(`${caminhoMaterialApi}/comentarios`, tokenPortal)
  const urlSolicitarAlteracoes = comTokenPortal(
    `${caminhoMaterialApi}/solicitar-alteracoes`,
    tokenPortal,
  )
  const urlAprovar = comTokenPortal(`${caminhoMaterialApi}/aprovar`, tokenPortal)

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!slugValido) {
        if (!silencioso) setCarregando(false)
        setErro(PORTAL_UNAVAILABLE_MESSAGE)
        return
      }
      if (!tokenPortal) {
        if (!silencioso) setCarregando(false)
        setErro(PORTAL_UNAVAILABLE_MESSAGE)
        return
      }
      if (!silencioso) setCarregando(true)
      setErro('')
      try {
        const [{ dado }, lista] = await Promise.all([
          requisicaoApi<{ dado: DetalhePortal }>(urlDetalhe),
          requisicaoApi<{ dados: ReviewComment[] }>(urlComentarios),
        ])
        setDetalhe({
          ...dado,
          versao: {
            ...dado.versao,
            imagemUrl: comTokenPortal(dado.versao.imagemUrl, tokenPortal),
          },
        })
        setComentarios(
          lista.dados.map((item) => ({
            ...item,
            createdAt: String(item.createdAt),
            updatedAt: String(item.updatedAt),
          })),
        )
      } catch (error) {
        if (!silencioso) setDetalhe(null)
        setErro(
          error instanceof ApiError && [401, 403, 404].includes(error.status)
            ? PORTAL_UNAVAILABLE_MESSAGE
            : 'Não foi possível abrir este material agora.',
        )
      } finally {
        if (!silencioso) setCarregando(false)
      }
    },
    [urlDetalhe, urlComentarios, slugValido, tokenPortal],
  )

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    if (draft) draftRef.current?.focus()
  }, [draft])

  const versaoAtualId = detalhe?.versao.id
  const comentariosDaVersao = useMemo(
    () => comentarios.filter((item) => item.versionId === versaoAtualId),
    [comentarios, versaoAtualId],
  )
  const abertos = useMemo(
    () => comentariosDaVersao.filter((item) => item.status === 'open').length,
    [comentariosDaVersao],
  )
  const aprovado = Boolean(detalhe?.material.status === 'aprovado' || detalhe?.versao.aprovada)
  const enviando = acaoEmAndamento !== null
  const publicarComentario = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft || !draftText.trim() || enviando) return
    setAcaoEmAndamento('comentario')
    setErro('')
    try {
      await requisicaoApi(urlComentarios, {
        method: 'POST',
        body: json({
          texto: draftText.trim(),
          posicaoX: draft.x,
          posicaoY: draft.y,
        }),
      })
      setDraft(null)
      setDraftText('')
      setCreationMode(false)
      setAviso('Comentário enviado. A equipe verá e poderá corrigir.')
      await carregar(true)
    } catch (error) {
      setErro(
        error instanceof ApiError && error.codigo === 'material_aprovado'
          ? 'Este material já foi aprovado e não aceita novos comentários.'
          : 'Não foi possível enviar o comentário. Seu texto foi preservado; tente novamente.',
      )
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  const solicitarAlteracoes = async () => {
    if (enviando) return
    setAcaoEmAndamento('alteracoes')
    setErro('')
    try {
      await requisicaoApi(urlSolicitarAlteracoes, { method: 'POST' })
      setAviso('Alterações solicitadas. A equipe foi avisada.')
      setCreationMode(false)
      setDraft(null)
      await carregar(true)
    } catch (error) {
      setErro(
        error instanceof ApiError && error.codigo === 'sem_pendencias'
          ? 'Adicione ao menos um comentário antes de solicitar alterações.'
          : 'Não foi possível solicitar alterações. Tente novamente.',
      )
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  const aprovar = async (confirmarPendencias: boolean) => {
    if (enviando) return
    setAcaoEmAndamento('aprovacao')
    setErro('')
    try {
      await requisicaoApi(urlAprovar, {
        method: 'POST',
        body: json({ confirmarPendencias }),
      })
      setDetalhe((atual) =>
        atual
          ? {
              ...atual,
              material: { ...atual.material, status: 'aprovado' },
              versao: { ...atual.versao, aprovada: true },
            }
          : atual,
      )
      setAviso('')
      setCreationMode(false)
      setDraft(null)
      setPendenciasParaConfirmar(null)
      await carregar(true)
    } catch (error) {
      if (
        !confirmarPendencias &&
        error instanceof ApiError &&
        error.codigo === 'pendencias_abertas'
      ) {
        const detalhes = error.detalhes as { total?: unknown } | undefined
        const total = Number(detalhes?.total)
        setPendenciasParaConfirmar(
          Number.isFinite(total) && total > 0 ? total : Math.max(1, abertos),
        )
      } else {
        setErro('Não foi possível registrar a aprovação. Tente novamente.')
      }
    } finally {
      setAcaoEmAndamento(null)
    }
  }

  const iniciarAprovacao = () => {
    if (enviando) return
    if (abertos > 0) {
      setPendenciasParaConfirmar(abertos)
      return
    }
    void aprovar(false)
  }

  if (carregando) {
    return <div className="px-5 py-16 text-center text-secondary">Carregando revisão...</div>
  }

  if (!detalhe) {
    return <PortalUnavailableState message={erro || undefined} />
  }

  return (
    <PortalBrandShell
      brand={detalhe.marca}
      companyName={detalhe.projeto.empresaNome}
      pageTitle={detalhe.material.nome}
    >
      <div className="flex min-h-screen flex-col">
        <div className="border-b border-line bg-background/75 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto mb-5 flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PortalBrandIdentity
              compact
              brand={detalhe.marca}
              companyName={detalhe.projeto.empresaNome}
            />
            <PortalAccessBadge />
          </div>
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                to={voltarHref}
                className="inline-flex items-center gap-2 text-sm text-secondary hover:opacity-80"
                style={{ color: 'var(--portal-brand, var(--brand-primary))' }}
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao projeto
              </Link>
              <h1 className="mt-3 break-words text-2xl font-semibold tracking-[-0.025em]">
                {detalhe.material.nome}
              </h1>
              <p className="mt-1 text-sm text-secondary">
                {detalhe.projeto.nome} · v{detalhe.versao.numero} ·{' '}
                {rotuloStatus[detalhe.material.status] ?? detalhe.material.status}
              </p>
              {aprovado && (
                <div
                  className="mt-4 flex max-w-xl items-start gap-3 rounded-md border border-approval/30 bg-approval-soft p-4"
                  role="status"
                  aria-label="Versão aprovada"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-approval" aria-hidden />
                  <div>
                    <p className="font-semibold text-ink">Versão aprovada</p>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">
                      Sua aprovação foi registrada com sucesso. Nenhuma ação adicional é necessária.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {!aprovado && (
              <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                <Button
                  variant={creationMode ? 'secondary' : 'outline'}
                  aria-pressed={creationMode}
                  disabled={enviando}
                  onClick={() => {
                    setCreationMode((v) => !v)
                    setDraft(null)
                    setDraftText('')
                  }}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {creationMode ? 'Cancelar comentário' : 'Comentar'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={enviando || abertos === 0}
                  loading={acaoEmAndamento === 'alteracoes'}
                  onClick={() => void solicitarAlteracoes()}
                >
                  {acaoEmAndamento === 'alteracoes' ? 'Solicitando...' : 'Solicitar alterações'}
                </Button>
                <Button
                  disabled={enviando}
                  loading={acaoEmAndamento === 'aprovacao' && pendenciasParaConfirmar === null}
                  onClick={iniciarAprovacao}
                >
                  {acaoEmAndamento !== 'aprovacao' && <Check className="h-4 w-4" />}
                  {acaoEmAndamento === 'aprovacao' && pendenciasParaConfirmar === null
                    ? 'Aprovando...'
                    : 'Aprovar'}
                </Button>
              </div>
            )}
          </div>
          {!aprovado && creationMode && (
            <p className="mx-auto mt-3 max-w-6xl text-sm font-medium text-secondary" role="status">
              Clique sobre o material para adicionar um comentário.
            </p>
          )}
          {!aprovado && !creationMode && abertos === 0 && (
            <p className="mx-auto mt-3 max-w-6xl text-xs text-muted">
              Para solicitar alterações, primeiro adicione um comentário indicando o que precisa
              mudar.
            </p>
          )}
          {(aviso || erro) && (
            <p
              className={cn(
                'mx-auto mt-3 max-w-6xl text-sm',
                erro ? 'text-revision' : 'text-approval',
              )}
              role={erro ? 'alert' : 'status'}
            >
              {erro || aviso}
            </p>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-0 lg:grid-cols-[1fr_20rem]">
          <div className="relative min-h-[28rem] border-b border-line lg:border-b-0 lg:border-r">
            {detalhe.material.tipo === 'imagem' && (
              <div
                className="absolute right-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] gap-1 overflow-x-auto rounded-md border border-line bg-surface-elevated p-1"
                aria-label="Nível de zoom"
              >
                {[75, 100, 125, 150].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    className={cn(
                      'min-h-9 shrink-0 rounded-sm px-2 text-xs font-semibold',
                      zoom === valor ? 'bg-brand text-brand-contrast' : 'text-secondary',
                    )}
                    onClick={() => setZoom(valor)}
                  >
                    {valor}%
                  </button>
                ))}
              </div>
            )}
            {detalhe.material.tipo === 'imagem' ? (
              <ImageReviewCanvas
                imageUrl={detalhe.versao.imagemUrl}
                comments={comentariosDaVersao}
                selectedId={selectedId}
                creationMode={creationMode && !aprovado}
                zoom={zoom}
                draftPosition={draft}
                onPoint={(position) => {
                  setDraft(position)
                  setDraftText('')
                  setSelectedId(null)
                }}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="relative grid min-h-[32rem] place-items-center overflow-auto bg-[#090d12] p-4">
                {creationMode && !aprovado && (
                  <Button
                    className="absolute left-4 top-4 z-10"
                    onClick={() => setDraft({ x: 0.5, y: 0.5 })}
                  >
                    Adicionar comentário geral
                  </Button>
                )}
                <MaterialPreview
                  type={detalhe.material.tipo === 'video' ? 'video' : 'pdf'}
                  url={detalhe.versao.imagemUrl}
                  title={detalhe.material.nome}
                />
              </div>
            )}
            {draft && (
              <form
                onSubmit={(event) => void publicarComentario(event)}
                className="fixed bottom-3 left-3 right-3 z-30 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-lg border border-line bg-surface-elevated p-4 shadow-raised sm:absolute sm:bottom-4 sm:left-auto sm:right-4 sm:w-80"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Novo comentário</p>
                  <IconButton
                    type="button"
                    label="Cancelar comentário"
                    onClick={() => {
                      setDraft(null)
                      setDraftText('')
                      setCreationMode(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
                <Textarea
                  ref={draftRef}
                  label="O que precisa mudar?"
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                  rows={3}
                  required
                />
                <Button
                  className="mt-3 w-full"
                  type="submit"
                  loading={acaoEmAndamento === 'comentario'}
                >
                  {acaoEmAndamento !== 'comentario' && <Send className="h-4 w-4" />}
                  {acaoEmAndamento === 'comentario' ? 'Enviando...' : 'Enviar comentário'}
                </Button>
              </form>
            )}
          </div>

          <aside className="max-h-[40vh] overflow-y-auto p-4 lg:max-h-none">
            <h2 className="font-semibold">Comentários ({comentariosDaVersao.length})</h2>
            <p className="mt-1 text-xs text-muted">{abertos} em aberto</p>
            <div className="mt-4 space-y-3">
              {comentariosDaVersao.map((comentario, index) => (
                <button
                  key={comentario.id}
                  type="button"
                  onClick={() => setSelectedId(comentario.id)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition-colors',
                    selectedId === comentario.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:bg-surface-secondary',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-brand">#{index + 1}</span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase',
                        comentario.status === 'open' ? 'text-revision' : 'text-approval',
                      )}
                    >
                      {comentario.status === 'open' ? 'Aberto' : 'Resolvido'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{comentario.authorName}</p>
                  <p className="mt-2 text-sm">{comentario.text}</p>
                </button>
              ))}
              {!comentariosDaVersao.length && (
                <p className="text-sm text-secondary">
                  {creationMode
                    ? 'Clique no material para marcar o que precisa de atenção.'
                    : 'Ainda não há comentários. Use “Comentar” quando quiser indicar um ajuste.'}
                </p>
              )}
            </div>
          </aside>
        </div>
        <p className="py-6 text-center text-xs text-muted">
          {detalhe.marca?.whiteLabel ? (
            <span>{detalhe.projeto.empresaNome} · Portal do cliente</span>
          ) : (
            <span>
              Portal de revisão · <span className="font-medium text-secondary">Viztto</span>
            </span>
          )}
        </p>
        <PortalApprovalDialog
          open={pendenciasParaConfirmar !== null}
          pendingCount={pendenciasParaConfirmar ?? 0}
          loading={acaoEmAndamento === 'aprovacao'}
          onCancel={() => {
            if (acaoEmAndamento !== 'aprovacao') setPendenciasParaConfirmar(null)
          }}
          onConfirm={() => void aprovar(true)}
        />
      </div>
    </PortalBrandShell>
  )
}
