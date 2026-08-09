import { FileImage, FileText, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { normalizeMaterialType, type MaterialType } from '@/lib/materialType'
import { loadPdfFirstPageThumbnail } from '@/lib/pdfFirstPage'

type Props = {
  type: string
  url?: string | null
  title?: string
  className?: string
  /** Altura do container (Tailwind). Default h-36 */
  heightClassName?: string
}

function Fallback({
  type,
  title,
}: {
  type: MaterialType
  title?: string
}) {
  const Icon = type === 'pdf' ? FileText : FileImage
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-secondary text-brand"
      role="img"
      aria-label={title ? `Prévia indisponível: ${title}` : 'Prévia indisponível'}
    >
      <Icon className="h-9 w-9" aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'PDF'}
      </span>
    </div>
  )
}

function PdfThumbnail({ url, title }: { url: string; title?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !url) return
    let ativo = true
    setLoading(true)
    setFailed(false)
    void loadPdfFirstPageThumbnail(url)
      .then((dataUrl) => {
        if (!ativo) return
        setSrc(dataUrl)
        setLoading(false)
      })
      .catch(() => {
        if (!ativo) return
        setFailed(true)
        setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [visible, url])

  return (
    <div ref={hostRef} className="relative h-full w-full overflow-hidden bg-white">
      {src && (
        <img
          src={src}
          alt={title ? `Primeira página de ${title}` : 'Primeira página do PDF'}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
      )}
      {loading && !src && (
        <div className="absolute inset-0 grid place-items-center bg-surface-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-muted" aria-label="Carregando prévia" />
        </div>
      )}
      {failed && !src && <Fallback type="pdf" title={title} />}
      {src && (
        <span className="absolute bottom-2 left-2 rounded-sm bg-revision px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-background">
          PDF
        </span>
      )}
    </div>
  )
}

function MediaThumbnail({
  type,
  url,
  title,
}: {
  type: 'image' | 'video'
  url: string
  title?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Fallback type={type} title={title} />
  if (type === 'video') {
    return (
      <video
        src={url}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        aria-label={title ? `Prévia de vídeo: ${title}` : 'Prévia de vídeo'}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <img
      src={url}
      alt={title ? `Prévia de ${title}` : 'Prévia da imagem'}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export function MaterialThumbnail({
  type,
  url,
  title,
  className,
  heightClassName = 'h-36',
}: Props) {
  const normalized = normalizeMaterialType(type)
  const hasUrl = Boolean(url?.trim())

  return (
    <div
      className={cn(
        'grid place-items-center overflow-hidden bg-surface-secondary surface-grid',
        heightClassName,
        className,
      )}
    >
      {!hasUrl ? (
        <Fallback type={normalized} title={title} />
      ) : normalized === 'pdf' ? (
        <PdfThumbnail url={url!} title={title} />
      ) : (
        <MediaThumbnail type={normalized} url={url!} title={title} />
      )}
    </div>
  )
}
