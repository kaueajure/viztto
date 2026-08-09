import { MaterialThumbnail } from '@/components/materials/MaterialThumbnail'

export function PortalMaterialThumbnail({
  type,
  imageUrl,
  title,
}: {
  type: string
  imageUrl: string | null
  title?: string
}) {
  return (
    <MaterialThumbnail
      type={type}
      url={imageUrl}
      title={title}
      heightClassName="h-16 w-20 shrink-0 rounded-md border border-line"
      className="!bg-surface-secondary"
    />
  )
}
