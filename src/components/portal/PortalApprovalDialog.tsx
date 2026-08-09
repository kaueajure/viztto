import { AlertTriangle, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Interactive'
import { Button } from '@/components/ui/Button'

export function PortalApprovalDialog({
  open,
  pendingCount,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean
  pendingCount: number
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const comentario = pendingCount === 1 ? 'comentário pendente' : 'comentários pendentes'

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Existem comentários pendentes"
      dismissible={!loading}
    >
      <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning-soft p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-dark" aria-hidden />
        <div>
          <p className="font-semibold text-ink">
            Esta versão ainda possui {pendingCount} {comentario}.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Aprovar mesmo com comentários abertos?
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" disabled={loading} onClick={onCancel}>
          Voltar
        </Button>
        <Button loading={loading} onClick={onConfirm}>
          {!loading && <Check className="h-4 w-4" aria-hidden />}
          {loading ? 'Aprovando...' : 'Aprovar mesmo assim'}
        </Button>
      </div>
    </Modal>
  )
}
