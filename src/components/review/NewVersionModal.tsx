import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'

export function NewVersionModal({
  open,
  onClose,
  nextNumber,
  onPublish,
}: {
  open: boolean
  onClose: () => void
  nextNumber: number
  onPublish: (input: {
    label: string
    description?: string
    imageUrl: string
    copyPending: boolean
  }) => void
}) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('/demo/review-campaign-v4.svg')
  const [copyPending, setCopyPending] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (open) {
      setLabel(`Versão ${nextNumber}`)
      setDescription('')
      setError('')
    }
  }, [open, nextNumber])
  return (
    <Modal open={open} onClose={onClose} title={`Publicar versão ${nextNumber}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!label.trim()) return setError('Informe um nome para a versão.')
          onPublish({
            label: label.trim(),
            description: description.trim() || undefined,
            imageUrl,
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
        <Select
          label="Imagem de demonstração"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        >
          <option value="/demo/review-campaign-v4.svg">Composição atualizada</option>
          <option value="/demo/review-campaign-v2.svg">Composição anterior</option>
        </Select>
        <Checkbox
          label="Copiar comentários ainda não resolvidos"
          checked={copyPending}
          onChange={setCopyPending}
        />
        <p className="text-xs text-muted">
          O envio é simulado e utiliza recursos locais nesta etapa.
        </p>
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
