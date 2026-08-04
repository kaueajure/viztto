import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/DataDisplay'
import { Checkbox } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'

export function ReviewDecisionModal({
  mode,
  open,
  onClose,
  materialName,
  version,
  openComments,
  clientName,
  onConfirm,
}: {
  mode: 'changes' | 'approve'
  open: boolean
  onClose: () => void
  materialName: string
  version: number
  openComments: number
  clientName: string
  onConfirm: () => void
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const approvalWarning = mode === 'approve' && openComments > 0
  return (
    <Modal
      open={open}
      onClose={() => {
        setAcknowledged(false)
        onClose()
      }}
      title={mode === 'changes' ? 'Solicitar alterações desta versão?' : 'Aprovar esta versão?'}
    >
      <div className="flex gap-3 rounded-md border border-line bg-surface-secondary p-4">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${mode === 'changes' ? 'bg-revision-soft text-revision' : 'bg-approval-soft text-approval'}`}
        >
          {mode === 'changes' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </span>
        <div>
          <p className="font-semibold">{materialName}</p>
          <p className="mt-1 text-sm text-secondary">
            {clientName} · versão {version} · responsável Marina
          </p>
          <div className="mt-2">
            <Badge tone={openComments ? 'revision' : 'approval'}>
              {openComments} comentário{openComments === 1 ? '' : 's'} aberto
              {openComments === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
      </div>
      {approvalWarning && (
        <div className="mt-4">
          <p className="text-sm text-revision">Esta versão ainda possui comentários pendentes.</p>
          <div className="mt-3">
            <Checkbox
              label="Entendo que os comentários permanecerão registrados"
              checked={acknowledged}
              onChange={setAcknowledged}
            />
          </div>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant={mode === 'changes' ? 'destructive' : 'primary'}
          disabled={approvalWarning && !acknowledged}
          onClick={() => {
            onConfirm()
            setAcknowledged(false)
          }}
        >
          {mode === 'changes' ? 'Solicitar alterações' : 'Aprovar versão'}
        </Button>
      </div>
    </Modal>
  )
}
