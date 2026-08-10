import { useEffect, useState } from 'react'
import { useAppData } from '@/contexts/AppDataContext'
import { dadosApi } from '@/services/api/dadosApi'

type AprovadorStatus = {
  usuarioId: string
  status: 'aprovado' | 'aguardando'
}

type Props = {
  materialId: string
  refreshKey?: string | number
}

export function MaterialApprovalsProgress({ materialId, refreshKey }: Props) {
  const { team } = useAppData()
  const [modo, setModo] = useState<'qualquer' | 'todos'>('qualquer')
  const [aprovadores, setAprovadores] = useState<AprovadorStatus[]>([])

  useEffect(() => {
    let ativo = true
    void dadosApi
      .statusAprovadores(materialId)
      .then(({ dado }) => {
        if (!ativo) return
        setModo(dado.modoAprovacao)
        setAprovadores(
          dado.aprovadores.map((item) => ({
            usuarioId: item.usuarioId,
            status: item.status === 'aprovado' ? 'aprovado' : 'aguardando',
          })),
        )
      })
      .catch(() => {
        if (ativo) setAprovadores([])
      })
    return () => {
      ativo = false
    }
  }, [materialId, refreshKey])

  if (aprovadores.length < 2 || modo !== 'todos') return null

  const aprovados = aprovadores.filter((item) => item.status === 'aprovado').length
  const total = aprovadores.length
  const completo = aprovados === total

  return (
    <div className="rounded-md border border-line bg-surface-secondary p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aprovações</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {aprovadores.map((item) => {
          const nome = team.find((membro) => membro.id === item.usuarioId)?.name ?? 'Aprovador'
          const ok = item.status === 'aprovado'
          return (
            <li key={item.usuarioId} className="flex items-center justify-between gap-2">
              <span className="truncate">{nome}</span>
              <span className={ok ? 'text-approval' : 'text-muted'}>
                {ok ? '✓ Aprovado' : '⏳ Aguardando'}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-secondary">
        {completo ? (
          <>
            {total} de {total} aprovações
            <span className="mt-1 block text-approval">✓ Material aprovado</span>
          </>
        ) : (
          `${aprovados} de ${total} aprovações`
        )}
      </p>
    </div>
  )
}
