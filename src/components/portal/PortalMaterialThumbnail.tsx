import { FileText, Image as ImageIcon, Play } from 'lucide-react'

export function PortalMaterialThumbnail({
  type,
  imageUrl,
}: {
  type: string
  imageUrl: string | null
}) {
  if (type === 'imagem' && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-16 w-20 shrink-0 rounded-md border border-line object-cover"
      />
    )
  }

  if (type === 'video') {
    return (
      <span
        aria-hidden
        className="relative grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-[#111827] text-white"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </span>
        <span className="absolute bottom-1.5 left-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">
          Vídeo
        </span>
      </span>
    )
  }

  if (type === 'pdf') {
    return (
      <span
        aria-hidden
        className="relative grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface-secondary"
      >
        <FileText className="h-7 w-7 text-revision" />
        <span className="absolute bottom-1.5 rounded-sm bg-revision px-1.5 py-0.5 text-[8px] font-bold tracking-[0.1em] text-background">
          PDF
        </span>
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className="grid h-16 w-20 shrink-0 place-items-center rounded-md border border-line bg-surface-secondary text-muted"
    >
      <ImageIcon className="h-6 w-6" />
    </span>
  )
}
