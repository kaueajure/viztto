import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { loadPdfDocument } from '@/lib/pdfDocument'

export type MaterialPreviewHandle = {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
  getPdfPage: () => number
  setPdfPage: (page: number) => void
}

export const MaterialPreview = forwardRef<
  MaterialPreviewHandle,
  {
    type: string
    url: string
    title: string
    className?: string
    initialPdfPage?: number
    seekSeconds?: number | null
    seekToken?: number
    onTimeUpdate?: (seconds: number) => void
    onPageChange?: (page: number) => void
  }
>(function MaterialPreview(
  {
    type,
    url,
    title,
    className = '',
    initialPdfPage = 1,
    seekSeconds = null,
    seekToken = 0,
    onTimeUpdate,
    onPageChange,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfPage, setPdfPage] = useState(Math.max(1, initialPdfPage))
  const [pageCount, setPageCount] = useState(1)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfErro, setPdfErro] = useState('')

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    seekTo: (seconds: number) => {
      if (!videoRef.current) return
      videoRef.current.currentTime = Math.max(0, seconds)
      void videoRef.current.play().catch(() => undefined)
    },
    getPdfPage: () => pdfPage,
    setPdfPage: (page: number) => {
      const next = Math.max(1, Math.floor(page))
      setPdfPage(next)
      onPageChange?.(next)
    },
  }))

  useEffect(() => {
    if (seekSeconds == null || !videoRef.current) return
    videoRef.current.currentTime = Math.max(0, seekSeconds)
  }, [seekSeconds, seekToken])

  useEffect(() => {
    if (initialPdfPage) setPdfPage(Math.max(1, initialPdfPage))
  }, [initialPdfPage])

  useEffect(() => {
    if (type !== 'pdf' || !url) return
    let ativo = true
    setPdfLoading(true)
    setPdfErro('')
    void (async () => {
      try {
        const doc = await loadPdfDocument(url)
        if (!ativo) return
        setPageCount(doc.numPages)
        const safePage = Math.min(Math.max(1, pdfPage), doc.numPages)
        if (safePage !== pdfPage) setPdfPage(safePage)
        const page = await doc.getPage(safePage)
        const base = page.getViewport({ scale: 1 })
        const maxWidth = Math.min(900, typeof window !== 'undefined' ? window.innerWidth - 64 : 900)
        const scale = Math.min(1.25, maxWidth / base.width)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas indisponível')
        await page.render({ canvasContext: context, viewport }).promise
        if (!ativo) return
        setPdfLoading(false)
      } catch {
        if (!ativo) return
        setPdfErro('Não foi possível carregar este PDF.')
        setPdfLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [type, url, pdfPage])

  if (!url) {
    return (
      <div
        className={`grid min-h-[12rem] place-items-center px-6 text-center text-sm text-muted ${className}`}
      >
        Sem pré-visualização
      </div>
    )
  }

  if (type === 'video')
    return (
      <div className={`w-full ${className}`}>
        <video
          ref={videoRef}
          className="max-h-full w-full"
          src={url}
          controls
          preload="metadata"
          onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
        />
      </div>
    )

  if (type === 'pdf') {
    return (
      <div className={`flex w-full flex-col gap-3 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pdfPage <= 1 || pdfLoading}
            onClick={() => {
              const next = Math.max(1, pdfPage - 1)
              setPdfPage(next)
              onPageChange?.(next)
            }}
          >
            Página anterior
          </Button>
          <span className="text-sm text-secondary">
            Página {pdfPage} de {pageCount}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={pdfPage >= pageCount || pdfLoading}
            onClick={() => {
              const next = Math.min(pageCount, pdfPage + 1)
              setPdfPage(next)
              onPageChange?.(next)
            }}
          >
            Próxima página
          </Button>
        </div>
        <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-md border border-line bg-white">
          <canvas ref={canvasRef} className="mx-auto block max-w-full" title={title} />
          {pdfLoading && (
            <div className="absolute inset-0 grid min-h-[20rem] place-items-center bg-white/90">
              <Loader2 className="h-7 w-7 animate-spin text-muted" aria-label="Carregando PDF" />
            </div>
          )}
          {pdfErro && (
            <div className="absolute inset-0 grid min-h-[20rem] place-items-center gap-2 px-6 text-center text-sm text-muted">
              <FileText className="h-8 w-8 text-brand" aria-hidden />
              {pdfErro}
            </div>
          )}
        </div>
      </div>
    )
  }

  return <img className={`max-h-full w-full object-contain ${className}`} src={url} alt={title} />
})
