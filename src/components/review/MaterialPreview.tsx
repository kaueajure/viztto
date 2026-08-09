export function MaterialPreview({
  type,
  url,
  title,
  className = '',
}: {
  type: string
  url: string
  title: string
  className?: string
}) {
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
      <video className={`max-h-full w-full ${className}`} src={url} controls preload="metadata" />
    )
  if (type === 'pdf')
    return (
      <iframe className={`min-h-[32rem] w-full bg-white ${className}`} src={url} title={title} />
    )
  return <img className={`max-h-full w-full object-contain ${className}`} src={url} alt={title} />
}
