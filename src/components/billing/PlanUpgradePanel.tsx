import { Check, Copy, CreditCard, QrCode, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MercadoPagoCardForm } from '@/components/billing/MercadoPagoCardForm'
import { Badge } from '@/components/ui/DataDisplay'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Interactive'
import {
  assinaturasApi,
  type AssinaturaBilling,
  type CheckoutConfig,
  type PlanoAssinatura,
} from '@/services/api/assinaturasApi'

type PlanCode = PlanoAssinatura['codigo']
type MetodoPagamento = 'cartao' | 'pix'
type PixPendente = {
  id: string
  qrCode: string | null
  qrCodeBase64: string | null
}

const order: Record<PlanCode, number> = { gratuito: 0, freelancer: 1, studio: 2, agency: 3 }

function formatarData(valor: string | Date | null | undefined) {
  if (!valor) return null
  const data = typeof valor === 'string' ? new Date(valor) : valor
  if (Number.isNaN(data.getTime())) return null
  return data.toLocaleDateString('pt-BR')
}

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
  const [billing, setBilling] = useState<AssinaturaBilling | null>(null)
  const [selected, setSelected] = useState<PlanoAssinatura | null>(null)
  const [metodo, setMetodo] = useState<MetodoPagamento>('cartao')
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [pixLoading, setPixLoading] = useState(false)
  const [pix, setPix] = useState<PixPendente | null>(null)
  const [copiado, setCopiado] = useState(false)
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
        setBilling(response.assinaturaBilling)
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
    if (!pix?.id || success) return
    const timer = window.setInterval(() => {
      void assinaturasApi
        .statusAssinatura(pix.id)
        .then((response) => {
          if (response.dado.status !== 'autorizada') return
          const codigo = response.dado.codigoPlano
          setSuccess('Pix confirmado. Plano liberado.')
          if (codigo) {
            onPurchasedRef.current(codigo)
            setActiveSubscription(codigo)
          }
          setBilling((atual) =>
            atual
              ? {
                  ...atual,
                  id: response.dado.id,
                  status: 'autorizada',
                  vigenciaAte: response.dado.vigenciaAte ?? null,
                  carenciaAte: null,
                  motivoStatus: null,
                  ehPix: true,
                }
              : {
                  id: response.dado.id,
                  status: 'autorizada',
                  vigenciaAte: response.dado.vigenciaAte ?? null,
                  carenciaAte: null,
                  motivoStatus: null,
                  ehPix: true,
                },
          )
          setPix(null)
        })
        .catch(() => undefined)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [pix?.id, success])

  function fecharModal() {
    setSelected(null)
    setMetodo('cartao')
    setError('')
    setSuccess('')
    setPixLoading(false)
    setPix(null)
    setCopiado(false)
  }

  async function submitSubscription(tokenCartao: string, emailPagador: string) {
    if (!selected) return
    setError('')
    const response = await assinaturasApi.criarAssinatura({
      codigoPlano: selected.codigo,
      tokenCartao,
      emailPagador,
    })
    const autorizada = response.dado.status === 'authorized' || response.dado.status === 'autorizada'
    setSuccess(
      autorizada
        ? 'Plano contratado.'
        : 'Assinatura enviada e aguardando confirmação.',
    )
    if (autorizada) {
      onPurchasedRef.current(selected.codigo)
      setActiveSubscription(selected.codigo)
      setBilling({
        id: response.dado.id,
        status: 'autorizada',
        carenciaAte: null,
        vigenciaAte: null,
        motivoStatus: null,
        ehPix: false,
      })
    }
  }

  async function gerarPix() {
    if (!selected) return
    setError('')
    setPixLoading(true)
    setCopiado(false)
    try {
      const response = await assinaturasApi.criarPix({
        codigoPlano: selected.codigo,
        emailPagador: payerEmail,
      })
      if (response.dado.status === 'approved' || response.dado.status === 'autorizada') {
        setSuccess('Pix confirmado. Plano liberado.')
        onPurchasedRef.current(selected.codigo)
        setActiveSubscription(selected.codigo)
        setBilling({
          id: response.dado.id,
          status: 'autorizada',
          carenciaAte: null,
          vigenciaAte: null,
          motivoStatus: null,
          ehPix: true,
        })
        setPix(null)
        return
      }
      setPix({
        id: response.dado.id,
        qrCode: response.dado.qrCode,
        qrCodeBase64: response.dado.qrCodeBase64,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o Pix.')
    } finally {
      setPixLoading(false)
    }
  }

  async function copiarCodigoPix() {
    if (!pix?.qrCode) return
    try {
      await navigator.clipboard.writeText(pix.qrCode)
      setCopiado(true)
    } catch {
      setError('Não foi possível copiar o código Pix.')
    }
  }

  async function cancelarPlano() {
    if (!billing?.id || !canManage) return
    setError('')
    setCancelando(true)
    try {
      const response = await assinaturasApi.cancelarAssinatura(billing.id)
      const fim = formatarData(response.dado.carenciaAte)
      setBilling({
        ...billing,
        status: response.dado.status,
        carenciaAte: response.dado.carenciaAte,
        motivoStatus: 'cancelamento_usuario',
      })
      setSuccess(
        fim
          ? `Cancelamento iniciado. Você mantém o plano até ${fim}.`
          : response.mensagem,
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar o plano.')
    } finally {
      setCancelando(false)
    }
  }

  const dataCarencia = formatarData(billing?.carenciaAte)
  const dataVigencia = formatarData(billing?.vigenciaAte)
  const planoPagoAtivo =
    Boolean(billing) &&
    activeSubscription != null &&
    activeSubscription !== 'gratuito' &&
    (billing?.status === 'autorizada' || billing?.status === 'pausada')
  const cancelamentoEmAndamento =
    billing?.status === 'pausada' && billing.motivoStatus === 'cancelamento_usuario'

  return (
    <section aria-labelledby="plans-title" className="grid gap-5">
      <div>
        <h3 id="plans-title" className="text-xl font-semibold text-ink">
          Escolha seu plano
        </h3>
        <p className="mt-2 text-sm text-muted">
          Faça upgrade com cobrança mensal. Cartão renova automaticamente; Pix libera o plano após a
          confirmação do pagamento.
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
      {dataCarencia && (
        <p
          role="status"
          className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
        >
          {cancelamentoEmAndamento
            ? `Cancelamento em andamento. Você mantém o acesso ao plano até ${dataCarencia}.`
            : `Há um problema de cobrança. Você mantém o acesso ao plano até ${dataCarencia}.`}
        </p>
      )}
      {!dataCarencia && dataVigencia && billing?.ehPix && (
        <p
          role="status"
          className="rounded-md border border-line bg-surface-secondary p-3 text-sm text-secondary"
        >
          Plano via Pix válido até {dataVigencia}. Renove antes dessa data para manter o acesso.
        </p>
      )}
      {planoPagoAtivo && canManage && !cancelamentoEmAndamento && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-secondary p-3">
          <p className="text-sm text-muted">
            Ao cancelar, você mantém o plano por mais 7 dias e depois volta ao gratuito.
          </p>
          <Button
            variant="secondary"
            loading={cancelando}
            disabled={loading}
            onClick={() => {
              void cancelarPlano()
            }}
          >
            Cancelar plano
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              {Boolean(plan.beneficios?.length) && (
                <ul className="mt-4 grid gap-1.5 text-sm text-secondary">
                  {plan.beneficios.slice(0, 6).map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-approval" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                className="mt-5 w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={
                  !canManage ||
                  isCurrent ||
                  !isUpgrade ||
                  Number(plan.valorMensal) <= 0 ||
                  !config?.configurada ||
                  loading
                }
                icon={
                  isCurrent ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />
                }
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setMetodo('cartao')
                  setPix(null)
                  setSelected(plan)
                }}
              >
                {!canManage
                  ? 'Somente administrador'
                  : isCurrent
                    ? 'Plano atual'
                    : Number(plan.valorMensal) <= 0
                      ? 'Incluso'
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
                  setPix(null)
                  setError('')
                }}
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Cartão no site
              </button>
              <button
                type="button"
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                  metodo === 'pix'
                    ? 'border-brand bg-brand-soft text-ink'
                    : 'border-line bg-surface text-secondary hover:border-line-strong'
                }`}
                onClick={() => {
                  setMetodo('pix')
                  setError('')
                }}
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Pix no site
              </button>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-approval" />
            {metodo === 'cartao'
              ? 'Os dados do cartão são protegidos e tokenizados pelo Mercado Pago. A renovação é automática.'
              : 'Pagamento via Pix gerado no Mercado Pago. O plano é liberado assim que o pagamento for confirmado e vale por 7 dias.'}
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
          ) : metodo === 'pix' ? (
            <div className="grid gap-4 rounded-lg border border-line bg-surface-secondary p-4 sm:p-5">
              {!pix ? (
                <>
                  <p className="text-sm text-muted">
                    Geramos um QR Code Pix com o valor do plano. Após o pagamento, a liberação é
                    automática.
                  </p>
                  <Button
                    className="w-full"
                    loading={pixLoading}
                    icon={<QrCode className="h-4 w-4" />}
                    onClick={() => {
                      void gerarPix()
                    }}
                  >
                    Gerar Pix
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Escaneie o QR Code ou copie o código. Esta tela atualiza sozinha quando o Pix for
                    confirmado.
                  </p>
                  {pix.qrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${pix.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="mx-auto h-52 w-52 rounded-md bg-white p-2"
                    />
                  )}
                  {pix.qrCode && (
                    <div className="grid gap-2">
                      <textarea
                        readOnly
                        value={pix.qrCode}
                        className="min-h-24 w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink"
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => {
                          void copiarCodigoPix()
                        }}
                      >
                        {copiado ? 'Código copiado' : 'Copiar código Pix'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            config?.chavePublica &&
            selected && (
              <MercadoPagoCardForm
                publicKey={config.chavePublica}
                payerEmail={payerEmail}
                submitLabel={`Assinar ${selected.nome}`}
                onSubmit={submitSubscription}
              />
            )
          )}
          <p className="text-center text-xs text-muted">
            A cobrança será processada com segurança pelo Mercado Pago.
          </p>
        </div>
      </Modal>
    </section>
  )
}
