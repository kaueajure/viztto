import { FileText, Loader2, MessageSquarePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ReviewPin } from '@/components/review/ReviewPin'
import { cn } from '@/lib/cn'
import { loadPdfDocument } from '@/lib/pdfDocument'
import type { ReviewComment } from '@/types/domain'

export function PdfReviewCanvas({
  url,
  page,
  comments,
  selectedId,
  creationMode,
  zoom,
  draftPosition,
  onPageChange,
  onPoint,
  onSelect,
}: {
  url: string
  page: number
  comments: ReviewComment[]
  selectedId: string | null
  creationMode: boolean
  zoom: number
  draftPosition?: { x: number; y: number } | null
  onPageChange: (page: number) => void
  onPoint: (position: { x: number; y: number; pdfPage: number }) => void
  onSelect: (commentId: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const currentPage = Math.min(Math.max(1, page), Math.max(1, pageCount))

  const pageComments = comments.filter(
    (comment) => (comment.pdfPage ?? 1) === currentPage,
  )

  useEffect(() => {
    if (!url) {
      setLoading(false)
      setErro('Sem pré-visualização')
      return
    }
    let ativo = true
    setLoading(true)
    setErro('')
    void (async () => {
      try {
        const doc = await loadPdfDocument(url)
        if (!ativo) return
        setPageCount(doc.numPages)
        const safePage = Math.min(Math.max(1, page), doc.numPages)
        const pdfPage = await doc.getPage(safePage)
        const base = pdfPage.getViewport({ scale: 1 })
        const maxWidth = Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 48 : 960)
        const scale = Math.min(1.35, maxWidth / base.width)
        const viewport = pdfPage.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas indisponível')
        await pdfPage.render({ canvasContext: context, viewport }).promise
        if (!ativo) return
        setLoading(false)
      } catch {
        if (!ativo) return
        setErro('Não foi possível carregar este PDF.')
        setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [url, page])

  return (
    <div
      className={cn(
        'relative grid min-h-[24rem] flex-1 touch-none place-items-center overflow-auto bg-[#090d12] p-4 sm:min-h-[32rem]',
        creationMode ? 'cursor-crosshair' : '',
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Página anterior
        </Button>
        <span className="text-sm text-secondary">
          Página {currentPage} de {pageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage >= pageCount || loading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próxima página
        </Button>
      </div>

      <div
        className="relative max-w-full select-none shadow-raised"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        onClick={(event) => {
          if (!creationMode || loading || erro) return
          const rect = event.currentTarget.getBoundingClientRect()
          onPoint({
            x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
            pdfPage: currentPage,
          })
        }}
        onKeyDown={(event) => {
          if (creationMode && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onPoint({ x: 0.5, y: 0.5, pdfPage: currentPage })
          }
        }}
        role={creationMode ? 'button' : 'group'}
        tabIndex={creationMode ? 0 : -1}
        aria-label={
          creationMode
            ? `PDF página ${currentPage}. Clique para posicionar o comentário.`
            : `PDF página ${currentPage} com comentários posicionados.`
        }
      >
        <canvas
          ref={canvasRef}
          className={cn('block max-w-full bg-white', loading || erro ? 'min-h-[20rem] min-w-[16rem]' : '')}
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-white/90">
            <Loader2 className="h-7 w-7 animate-spin text-muted" aria-label="Carregando PDF" />
          </div>
        )}
        {erro && (
          <div className="absolute inset-0 grid place-items-center gap-2 bg-surface-secondary px-6 text-center text-sm text-muted">
            <FileText className="h-8 w-8 text-brand" aria-hidden />
            {erro}
          </div>
        )}
        {!loading &&
          !erro &&
          pageComments.map((comment, index) => (
            <ReviewPin
              key={comment.id}
              number={index + 1}
              comment={comment}
              active={selectedId === comment.id}
              onSelect={() => onSelect(comment.id)}
            />
          ))}
        {draftPosition && !loading && !erro && (
          <span
            aria-hidden
            className="absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-brand text-xs font-bold text-brand-contrast ring-4 ring-brand/25"
            style={{ left: `${draftPosition.x * 100}%`, top: `${draftPosition.y * 100}%` }}
          >
            +
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-line bg-surface-elevated/95 px-3 py-2 text-xs text-secondary">
        <MessageSquarePlus className="h-4 w-4 text-brand" />
        {creationMode
          ? `Clique na página ${currentPage} para posicionar o comentário`
          : `Comentários desta página: ${pageComments.length}`}
      </div>
    </div>
  )
}
