import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Textarea } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'

export function NewVersionModal({
  open,
  onClose,
  nextNumber,
  materialType,
  onPublish,
}: {
  open: boolean
  onClose: () => void
  nextNumber: number
  materialType: 'image' | 'video' | 'pdf'
  onPublish: (input: {
    label: string
    description?: string
    file: File
    copyPending: boolean
  }) => void
}) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [copyPending, setCopyPending] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (open) {
      setLabel(`Versão ${nextNumber}`)
      setDescription('')
      setFile(null)
      setError('')
    }
  }, [open, nextNumber])
  return (
    <Modal open={open} onClose={onClose} title={`Publicar versão ${nextNumber}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!label.trim()) return setError('Informe um nome para a versão.')
          if (!file) return setError('Selecione o arquivo da nova versão.')
          onPublish({
            label: label.trim(),
            description: description.trim() || undefined,
            file,
            copyPending,
          })
        }}
        className="grid gap-4"
      >
        <Input
          autoFocus
          label="Nome da versão"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={error}
        />
        <Textarea
          label="Descrição opcional"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <label className="grid gap-2 text-sm font-medium text-ink">
          Arquivo da nova versão
          <input
            className="min-h-11 rounded-md border border-line bg-surface px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-brand"
            type="file"
            accept={
              materialType === 'video'
                ? 'video/mp4,video/webm,video/quicktime'
                : materialType === 'pdf'
                  ? 'application/pdf'
                  : 'image/jpeg,image/png,image/webp'
            }
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <Checkbox
          label="Copiar comentários ainda não resolvidos"
          checked={copyPending}
          onChange={setCopyPending}
        />
        <p className="text-xs text-muted">O arquivo será validado e armazenado pelo servidor.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Publicar versão</Button>
        </div>
      </form>
    </Modal>
  )
}
