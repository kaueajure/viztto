import { Check, CreditCard, ExternalLink, ShieldCheck, Wallet } from 'lucide-react'
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
type MetodoPagamento = 'cartao' | 'mercado_pago'
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
  const [metodo, setMetodo] = useState<MetodoPagamento>('cartao')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('assinatura') !== 'pendente') return
    setSuccess(
      'Pagamento iniciado no Mercado Pago. O plano será liberado assim que a confirmação chegar.',
    )
    params.delete('assinatura')
    const query = params.toString()
    const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  }, [])

  function fecharModal() {
    setSelected(null)
    setMetodo('cartao')
    setError('')
    setSuccess('')
    setCheckoutLoading(false)
  }

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

  async function abrirCheckoutMercadoPago() {
    if (!selected) return
    setError('')
    setCheckoutLoading(true)
    try {
      const response = await assinaturasApi.criarCheckout({
        codigoPlano: selected.codigo,
        emailPagador: config?.emailPagadorTeste ?? payerEmail,
      })
      window.location.assign(response.dado.checkoutUrl)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível abrir o checkout do Mercado Pago.',
      )
      setCheckoutLoading(false)
    }
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
      {success && !selected && (
        <p
          role="status"
          className="rounded-md border border-approval/30 bg-approval-soft p-3 text-sm text-approval"
        >
          {success}
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
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setMetodo('cartao')
                  setSelected(plan)
                }}
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
        onClose={fecharModal}
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

          {!success && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                  metodo === 'cartao'
                    ? 'border-brand bg-brand-soft text-ink'
                    : 'border-line bg-surface text-secondary hover:border-line-strong'
                }`}
                onClick={() => {
                  setMetodo('cartao')
                  setError('')
                }}
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Cartão no site
              </button>
              <button
                type="button"
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                  metodo === 'mercado_pago'
                    ? 'border-brand bg-brand-soft text-ink'
                    : 'border-line bg-surface text-secondary hover:border-line-strong'
                }`}
                onClick={() => {
                  setMetodo('mercado_pago')
                  setError('')
                }}
              >
                <Wallet className="h-4 w-4" aria-hidden="true" />
                Pix no Mercado Pago
              </button>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-approval" />
            {metodo === 'cartao'
              ? 'Os dados do cartão são protegidos e tokenizados pelo Mercado Pago.'
              : 'Você será redirecionado ao Mercado Pago para pagar com Pix ou outro meio disponível na conta.'}
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
              <Button className="mt-4" onClick={fecharModal}>
                Concluir
              </Button>
            </div>
          ) : metodo === 'mercado_pago' ? (
            <div className="grid gap-3 rounded-lg border border-line bg-surface-secondary p-4 sm:p-5">
              <p className="text-sm text-muted">
                No checkout do Mercado Pago você pode concluir com Pix. O plano é liberado após a
                confirmação do pagamento.
              </p>
              <Button
                className="w-full"
                loading={checkoutLoading}
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  void abrirCheckoutMercadoPago()
                }}
              >
                Continuar no Mercado Pago
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
