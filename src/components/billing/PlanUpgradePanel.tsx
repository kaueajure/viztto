import { Check, CreditCard, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
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
  const [brickReady, setBrickReady] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const onPurchasedRef = useRef(onPurchased)
  onPurchasedRef.current = onPurchased
  const generatedId = useId()
  const brickId = `mercado-pago-${generatedId.replace(/:/g, '')}`

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
    if (!selected || !config?.chavePublica || !window.MercadoPago) return
    let active = true
    let controller: MercadoPagoBrickController | undefined
    setBrickReady(false)
    setError('')
    setSuccess('')
    const mercadoPago = new window.MercadoPago(config.chavePublica, { locale: 'pt-BR' })
    const checkoutEmail = config.ambiente === 'teste' ? 'test@testuser.com' : payerEmail
    void mercadoPago
      .bricks()
      .create('cardPayment', brickId, {
        initialization: { amount: Number(selected.valorMensal), payer: { email: checkoutEmail } },
        customization: {
          visual: {
            style: {
              theme: 'dark',
              customVariables: {
                textPrimaryColor: '#f5f7fa',
                textSecondaryColor: '#a7b0be',
                inputBackgroundColor: '#151b23',
                formBackgroundColor: '#202a38',
                baseColor: '#b8ff4f',
                baseColorFirstVariant: '#a2ea36',
                baseColorSecondVariant: '#8fd025',
                errorColor: '#ff6b57',
                successColor: '#7cffb2',
                successSecondaryColor: '#13281e',
                outlinePrimaryColor: '#3a4658',
                outlineSecondaryColor: '#2a3442',
                buttonTextColor: '#10150b',
                fontSizeSmall: '13px',
                fontSizeMedium: '15px',
                fontSizeLarge: '18px',
                fontWeightNormal: '400',
                fontWeightSemiBold: '600',
                inputVerticalPadding: '12px',
                inputHorizontalPadding: '14px',
                inputFocusedBoxShadow: '0 0 0 3px rgba(184, 255, 79, 0.24)',
                inputErrorFocusedBoxShadow: '0 0 0 3px rgba(255, 107, 87, 0.2)',
                inputBorderWidth: '1px',
                inputFocusedBorderWidth: '1px',
                borderRadiusSmall: '8px',
                borderRadiusMedium: '10px',
                borderRadiusLarge: '14px',
                formPadding: '0px',
              },
            },
            texts: {
              formTitle: 'Dados do cartão',
              cardNumber: { label: 'Número do cartão', placeholder: '0000 0000 0000 0000' },
              expirationDate: { label: 'Validade', placeholder: 'MM/AA' },
              securityCode: { label: 'Código de segurança', placeholder: 'CVV' },
              cardholderName: { label: 'Nome impresso no cartão', placeholder: 'Nome completo' },
              cardholderIdentification: { label: 'Documento do titular' },
              formSubmit: `Assinar ${selected.nome}`,
            },
          },
          paymentMethods: { maxInstallments: 1 },
        },
        callbacks: {
          onReady: () => active && setBrickReady(true),
          onSubmit: async (formData) => {
            if (!formData.token)
              throw new Error('O Mercado Pago não gerou o token do cartão. Revise os dados.')
            const response = await assinaturasApi.criarAssinatura({
              codigoPlano: selected.codigo,
              tokenCartao: formData.token,
              emailPagador: formData.payer?.email || checkoutEmail,
            })
            if (!active) return
            setSuccess(
              response.dado.status === 'authorized'
                ? 'Plano contratado com sucesso.'
                : 'Assinatura enviada e aguardando confirmação.',
            )
            onPurchasedRef.current(selected.codigo)
            setActiveSubscription(selected.codigo)
          },
          onError: (cause) => {
            console.error('Falha no formulário seguro do Mercado Pago.', cause)
            if (active) setError('Não foi possível carregar o pagamento. Tente novamente.')
          },
        },
      })
      .then((created) => {
        controller = created
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o checkout.')
      })
    return () => {
      active = false
      void controller?.unmount()
    }
  }, [brickId, config?.ambiente, config?.chavePublica, payerEmail, selected])

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
          O checkout ainda não está disponível porque as credenciais de pagamento não foram
          configuradas no servidor.
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
          {!brickReady && !error && (
            <p role="status" className="text-sm text-muted">
              Carregando pagamento seguro…
            </p>
          )}
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
            <div id={brickId} className="min-h-[420px] overflow-hidden rounded-lg" />
          )}
          <p className="text-center text-xs text-muted">
            {config?.ambiente === 'teste'
              ? 'Ambiente de teste · pagador sandbox test@testuser.com · nenhuma cobrança real.'
              : 'A cobrança será processada com segurança pelo Mercado Pago.'}
          </p>
        </div>
      </Modal>
    </section>
  )
}
