import { ArrowLeft, Check, MessageSquarePlus, Send, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { Link, useParams } from 'react-router'
import { ImageReviewCanvas } from '@/components/review/ImageReviewCanvas'
import { MaterialPreview } from '@/components/review/MaterialPreview'
import { Button, IconButton } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/FormControls'
import { caminhoPortalProjeto, UUID_RE } from '@/lib/portalPaths'
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
  marca?: {
    corPrincipal: string
    logoUrl: string | null
    whiteLabel: boolean
  }
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
  const [detalhe, setDetalhe] = useState<DetalhePortal | null>(null)
  const [comentarios, setComentarios] = useState<ReviewComment[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [creationMode, setCreationMode] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [zoom, setZoom] = useState(100)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  const slugValido = Boolean(workspaceSlug) && UUID_RE.test(projectId)
  const voltarHref = caminhoPortalProjeto(workspaceSlug, projectId)
  const base = `/api/portal/projetos/${projectId}/materiais/${materialId}?slug=${encodeURIComponent(workspaceSlug)}`
  const baseMutacao = `/api/portal/projetos/${projectId}/materiais/${materialId}`

  const carregar = useCallback(async () => {
    if (!slugValido) {
      setCarregando(false)
      setErro('Este link não é válido.')
      return
    }
    setCarregando(true)
    setErro('')
    try {
      const [{ dado }, lista] = await Promise.all([
        requisicaoApi<{ dado: DetalhePortal }>(base),
        requisicaoApi<{ dados: ReviewComment[] }>(`${baseMutacao}/comentarios`),
      ])
      setDetalhe(dado)
      setComentarios(
        lista.dados.map((item) => ({
          ...item,
          createdAt: String(item.createdAt),
          updatedAt: String(item.updatedAt),
        })),
      )
    } catch (error) {
      setDetalhe(null)
      setErro(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível abrir este material.',
      )
    } finally {
      setCarregando(false)
    }
  }, [base, baseMutacao, slugValido])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    if (draft) draftRef.current?.focus()
  }, [draft])

  const abertos = useMemo(
    () => comentarios.filter((item) => item.status === 'open').length,
    [comentarios],
  )
  const aprovado = detalhe?.material.status === 'aprovado'
  const estiloMarca = detalhe?.marca
    ? ({ ['--portal-brand' as string]: detalhe.marca.corPrincipal } as CSSProperties)
    : undefined

  const publicarComentario = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft || !draftText.trim()) return
    setEnviando(true)
    setErro('')
    try {
      await requisicaoApi(`${baseMutacao}/comentarios`, {
        method: 'POST',
        body: json({
          texto: draftText.trim(),
          posicaoX: draft.x,
          posicaoY: draft.y,
        }),
      })
      setDraft(null)
      setDraftText('')
      setAviso('Comentário enviado. A equipe verá e poderá corrigir.')
      await carregar()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível enviar o comentário.')
    } finally {
      setEnviando(false)
    }
  }

  const solicitarAlteracoes = async () => {
    setEnviando(true)
    setErro('')
    try {
      await requisicaoApi(`${baseMutacao}/solicitar-alteracoes`, { method: 'POST' })
      setAviso('Alterações solicitadas. A equipe foi avisada.')
      await carregar()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível solicitar alterações.')
    } finally {
      setEnviando(false)
    }
  }

  const aprovar = async () => {
    setEnviando(true)
    setErro('')
    try {
      await requisicaoApi(`${baseMutacao}/aprovar`, {
        method: 'POST',
        body: json({ confirmarPendencias: abertos > 0 }),
      })
      setAviso('Versão aprovada. Obrigado!')
      setCreationMode(false)
      await carregar()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível aprovar.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <div className="px-5 py-16 text-center text-secondary">Carregando revisão...</div>
  }

  if (!detalhe) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Revisão indisponível</h1>
        <p className="mt-3 text-secondary">{erro}</p>
        <Link className="mt-6 inline-block text-sm font-semibold text-brand" to={voltarHref}>
          Voltar ao projeto
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col" style={estiloMarca}>
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to={voltarHref}
              className="inline-flex items-center gap-2 text-sm text-secondary hover:opacity-80"
              style={{ color: 'var(--portal-brand, var(--color-brand))' }}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao projeto
            </Link>
            {detalhe.marca?.logoUrl && (
              <img
                src={detalhe.marca.logoUrl}
                alt=""
                className="mt-3 h-8 w-auto object-contain"
              />
            )}
            <p className="mt-2 text-sm text-muted">{detalhe.projeto.empresaNome}</p>
            <h1 className="truncate text-2xl font-semibold">{detalhe.material.nome}</h1>
            <p className="mt-1 text-sm text-secondary">
              {detalhe.projeto.nome} · v{detalhe.versao.numero} ·{' '}
              {rotuloStatus[detalhe.material.status] ?? detalhe.material.status}
            </p>
          </div>
          {!aprovado && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={creationMode ? 'secondary' : 'outline'}
                onClick={() => {
                  setCreationMode((v) => !v)
                  setDraft(null)
                }}
              >
                <MessageSquarePlus className="h-4 w-4" />
                {creationMode ? 'Comentando' : 'Comentar'}
              </Button>
              <Button
                variant="destructive"
                disabled={enviando || abertos === 0}
                onClick={() => void solicitarAlteracoes()}
              >
                Solicitar alterações
              </Button>
              <Button disabled={enviando} onClick={() => void aprovar()}>
                <Check className="h-4 w-4" /> Aprovar
              </Button>
            </div>
          )}
        </div>
        {(aviso || erro) && (
          <p
            className={cn(
              'mx-auto mt-3 max-w-6xl text-sm',
              erro ? 'text-revision' : 'text-approval',
            )}
            role="status"
          >
            {erro || aviso}
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-0 lg:grid-cols-[1fr_20rem]">
        <div className="relative min-h-[28rem] border-b border-line lg:border-b-0 lg:border-r">
          <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-md border border-line bg-surface-elevated p-1">
            {[75, 100, 125, 150].map((valor) => (
              <button
                key={valor}
                type="button"
                className={cn(
                  'min-h-9 rounded-sm px-2 text-xs font-semibold',
                  zoom === valor ? 'bg-brand text-brand-contrast' : 'text-secondary',
                )}
                onClick={() => setZoom(valor)}
              >
                {valor}%
              </button>
            ))}
          </div>
          {detalhe.material.tipo === 'imagem' ? (
            <ImageReviewCanvas
              imageUrl={detalhe.versao.imagemUrl}
              comments={comentarios}
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
              className="absolute bottom-4 left-4 right-4 z-30 rounded-lg border border-line bg-surface-elevated p-4 shadow-raised sm:left-auto sm:right-4 sm:w-80"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Novo comentário</p>
                <IconButton
                  label="Cancelar comentário"
                  onClick={() => {
                    setDraft(null)
                    setDraftText('')
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
              <Button className="mt-3 w-full" type="submit" loading={enviando}>
                <Send className="h-4 w-4" /> Enviar comentário
              </Button>
            </form>
          )}
        </div>

        <aside className="max-h-[40vh] overflow-y-auto p-4 lg:max-h-none">
          <h2 className="font-semibold">Comentários ({comentarios.length})</h2>
          <p className="mt-1 text-xs text-muted">{abertos} em aberto</p>
          <div className="mt-4 space-y-3">
            {comentarios.map((comentario, index) => (
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
            {!comentarios.length && (
              <p className="text-sm text-secondary">
                Clique na imagem para marcar o que precisa de atenção.
              </p>
            )}
          </div>
        </aside>
      </div>
      {!detalhe.marca?.whiteLabel && (
        <p className="py-6 text-center text-xs text-muted">
          Portal de revisão · <span className="font-medium text-secondary">Viztto</span>
        </p>
      )}
    </div>
  )
}
