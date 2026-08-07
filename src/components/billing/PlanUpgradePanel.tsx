import { Check, CreditCard, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MercadoPagoCardForm } from '@/components/billing/MercadoPagoCardForm'
import { Badge } from '@/components/ui/DataDisplay'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Interactive'
import {
  assinaturasApi,
  type CheckoutConfig,
  type PlanoAssinatura,
} from '@/services/api/assinaturasApi'

type PlanCode = PlanoAssinatura['codigo']
const order: Record<PlanCode, number> = { freelancer: 0, studio: 1, agency: 2 }

export function PlanUpgradePanel({
  payerEmail,
  canManage,
  onPurchased,
}: {
  payerEmail: string
  canManage: boolean
  onPurchased: (plan: PlanCode) => void
}) {
  const [plans, setPlans] = useState<PlanoAssinatura[]>([])
  const [config, setConfig] = useState<CheckoutConfig | null>(null)
  const [activeSubscription, setActiveSubscription] = useState<PlanCode | null>(null)
  const [selected, setSelected] = useState<PlanoAssinatura | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const onPurchasedRef = useRef(onPurchased)
  onPurchasedRef.current = onPurchased

  useEffect(() => {
    let active = true
    void assinaturasApi
      .listarPlanos()
      .then((response) => {
        if (!active) return
        setPlans(response.dados)
        setConfig(response.integracao)
        setActiveSubscription(response.assinaturaAtual)
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os planos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function submitSubscription(tokenCartao: string, emailPagador: string) {
    if (!selected) return
    setError('')
    const response = await assinaturasApi.criarAssinatura({
      codigoPlano: selected.codigo,
      tokenCartao,
      emailPagador,
    })
    setSuccess(
      response.dado.status === 'authorized'
        ? 'Plano contratado com sucesso.'
        : 'Assinatura enviada e aguardando confirmação.',
    )
    onPurchasedRef.current(selected.codigo)
    setActiveSubscription(selected.codigo)
  }

  return (
    <section aria-labelledby="plans-title" className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="plans-title" className="text-xl font-semibold text-ink">
            Escolha seu plano
          </h3>
          {config && <Badge tone="warning">Mercado Pago · {config.ambiente}</Badge>}
        </div>
        <p className="mt-2 text-sm text-muted">
          Faça upgrade com cobrança mensal. Você confirma os dados antes de concluir.
        </p>
      </div>
      {error && !selected && (
        <p role="alert" className="text-sm text-revision">
          {error}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.codigo === activeSubscription
          const isUpgrade = !activeSubscription || order[plan.codigo] > order[activeSubscription]
          return (
            <article
              key={plan.id}
              className={`rounded-lg border p-5 ${isCurrent ? 'border-brand bg-brand-soft' : 'border-line bg-surface-secondary'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-ink">{plan.nome}</h4>
                {isCurrent && <Badge tone="brand">Plano atual</Badge>}
              </div>
              <p className="mt-3 text-2xl font-semibold text-ink">
                {Number(plan.valorMensal).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: plan.moeda,
                })}
                <span className="text-sm font-normal text-muted">/mês</span>
              </p>
              <p className="mt-3 min-h-10 text-sm text-muted">{plan.descricao}</p>
              <Button
                className="mt-5 w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={!canManage || isCurrent || !isUpgrade || !config?.configurada || loading}
                icon={
                  isCurrent ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />
                }
                onClick={() => setSelected(plan)}
              >
                {!canManage
                  ? 'Somente administrador'
                  : isCurrent
                    ? 'Plano atual'
                    : isUpgrade
                      ? activeSubscription
                        ? 'Fazer upgrade'
                        : 'Comprar plano'
                      : 'Plano inferior'}
              </Button>
            </article>
          )
        })}
      </div>
      {config && !config.configurada && (
        <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          {config.problemaConfiguracao ??
            'O checkout ainda não está disponível porque o pagamento não foi configurado.'}
        </p>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Assinar ${selected.nome}` : 'Assinar plano'}
        size="wide"
      >
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-md border border-line bg-surface-secondary p-3 sm:px-4">
            <div>
              <p className="font-semibold text-ink">{selected?.nome}</p>
              <p className="text-sm text-muted">Cobrança mensal</p>
            </div>
            <p className="font-semibold text-brand">
              {selected &&
                Number(selected.valorMensal).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: selected.moeda,
                })}
            </p>
          </div>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="h-4 w-4 text-approval" />
            Os dados do cartão são protegidos e tokenizados pelo Mercado Pago.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-revision/30 bg-revision-soft p-3 text-sm text-revision"
            >
              {error}
            </p>
          )}
          {success ? (
            <div
              role="status"
              className="rounded-md border border-approval/30 bg-approval-soft p-4 text-sm text-approval"
            >
              <p className="font-semibold">{success}</p>
              <Button className="mt-4" onClick={() => setSelected(null)}>
                Concluir
              </Button>
            </div>
          ) : (
            config?.chavePublica &&
            selected && (
              <MercadoPagoCardForm
                publicKey={config.chavePublica}
                payerEmail={config.emailPagadorTeste ?? payerEmail}
                submitLabel={`Assinar ${selected.nome}`}
                onSubmit={submitSubscription}
              />
            )
          )}
          <p className="text-center text-xs text-muted">
            {config?.ambiente === 'teste'
              ? `Ambiente de teste · pagador ${config.emailPagadorTeste ?? 'não configurado'} · nenhuma cobrança real.`
              : 'A cobrança será processada com segurança pelo Mercado Pago.'}
          </p>
        </div>
      </Modal>
    </section>
  )
}
