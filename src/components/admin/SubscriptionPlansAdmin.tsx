import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/DataDisplay'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import {
  assinaturasApi,
  type IntegracaoMercadoPago,
  type PlanoAssinatura,
} from '@/services/api/assinaturasApi'

export function SubscriptionPlansAdmin() {
  const [plans, setPlans] = useState<PlanoAssinatura[]>([])
  const [integration, setIntegration] = useState<IntegracaoMercadoPago | null>(null)
  const [busy, setBusy] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    const response = await assinaturasApi.listarPlanosAdmin()
    setPlans(response.dados)
    setIntegration(response.integracao)
  }
  useEffect(() => {
    void load().catch((cause) =>
      setFeedback({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Não foi possível carregar os planos.',
      }),
    )
  }, [])

  const run = async (key: string, action: () => Promise<{ mensagem: string }>) => {
    setBusy(key)
    setFeedback(null)
    try {
      const result = await action()
      setFeedback({ kind: 'success', text: result.mensagem })
      await load()
    } catch (cause) {
      setFeedback({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Não foi possível concluir.',
      })
    } finally {
      setBusy('')
    }
  }
  const change = (id: string, patch: Partial<PlanoAssinatura>) =>
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)))

  return (
    <section aria-labelledby="admin-plans-title" className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="admin-plans-title" className="text-xl font-semibold text-ink">
            Planos de assinatura
          </h3>
          <Badge tone={integration?.ambiente === 'teste' ? 'warning' : 'approval'}>
            {integration?.ambiente ?? 'teste'}
          </Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Área exclusiva do administrador do sistema. Salvar altera o preço no Viztto; sincronizar
          publica o valor no plano associado do Mercado Pago.
        </p>
      </div>
      {integration && !integration.configurada && (
        <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          Credenciais de teste ainda não configuradas. A edição local funciona, mas a sincronização
          está bloqueada.
        </p>
      )}
      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={feedback.kind === 'error' ? 'text-sm text-revision' : 'text-sm text-approval'}
        >
          {feedback.text}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => {
          const amount = Number(plan.valorMensal)
          return (
            <article
              key={plan.id}
              className="rounded-lg border border-line bg-surface-secondary p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{plan.nome}</p>
                  <p className="mt-1 text-xs text-muted">{plan.descricao}</p>
                </div>
                <Badge tone={plan.ativo ? 'approval' : 'neutral'}>
                  {plan.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <Input
                className="mt-4"
                label="Preço mensal (R$)"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={Number.isFinite(amount) ? amount : ''}
                onChange={(event) => change(plan.id, { valorMensal: event.target.value })}
              />
              <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={plan.ativo}
                  onChange={(event) => change(plan.id, { ativo: event.target.checked })}
                />
                Disponível para assinatura
              </label>
              <p className="mt-3 truncate text-xs text-muted">
                {plan.mercadoPagoPlanoId
                  ? `Mercado Pago: ${plan.mercadoPagoPlanoId}`
                  : 'Ainda não sincronizado'}
              </p>
              <div className="mt-4 grid gap-2">
                <Button
                  variant="secondary"
                  loading={busy === `save-${plan.codigo}`}
                  onClick={() =>
                    void run(`save-${plan.codigo}`, () =>
                      assinaturasApi.atualizarPlano(plan.codigo, amount, plan.ativo),
                    )
                  }
                >
                  Salvar preço
                </Button>
                <Button
                  disabled={!integration?.configurada}
                  loading={busy === `sync-${plan.codigo}`}
                  onClick={() =>
                    void run(`sync-${plan.codigo}`, () =>
                      assinaturasApi.sincronizarPlano(plan.codigo),
                    )
                  }
                >
                  Sincronizar teste
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
