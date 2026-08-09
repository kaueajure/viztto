import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

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
  const [pdfPage, setPdfPage] = useState(Math.max(1, initialPdfPage))

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
    const src = `${url}#page=${pdfPage}`
    return (
      <div className={`flex w-full flex-col gap-3 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next = Math.max(1, pdfPage - 1)
              setPdfPage(next)
              onPageChange?.(next)
            }}
          >
            Página anterior
          </Button>
          <span className="text-sm text-secondary">Página {pdfPage}</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next = pdfPage + 1
              setPdfPage(next)
              onPageChange?.(next)
            }}
          >
            Próxima página
          </Button>
        </div>
        <iframe className="min-h-[32rem] w-full bg-white" src={src} title={title} />
      </div>
    )
  }

  return <img className={`max-h-full w-full object-contain ${className}`} src={url} alt={title} />
})
