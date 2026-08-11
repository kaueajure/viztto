import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import type { IdentidadePortal } from '@/lib/portalIdentidade'

export function PortalIdentityGate({
  open,
  initial,
  onConfirm,
  onCancel,
  titulo = 'Quem está revisando?',
  descricao = 'Informe o nome e o email cadastrados como contato deste cliente.',
}: {
  open: boolean
  initial?: IdentidadePortal | null
  onConfirm: (identidade: IdentidadePortal) => void
  onCancel: () => void
  titulo?: string
  descricao?: string
}) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')

  if (!open) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!nome.trim() || !email.trim()) return
    onConfirm({ nome: nome.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal>
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-raised"
      >
        <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
        <p className="mt-1 text-sm text-secondary">{descricao}</p>
        <div className="mt-4 grid gap-3">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </div>
  )
}
