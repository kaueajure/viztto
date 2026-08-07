import { CreditCard, LockKeyhole } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type SecureFieldName = 'cardNumber' | 'expirationDate' | 'securityCode'

const fieldLabels: Record<SecureFieldName, string> = {
  cardNumber: 'Número do cartão',
  expirationDate: 'Validade',
  securityCode: 'Código de segurança',
}

function SecureField({
  id,
  name,
  focused,
  invalid,
}: {
  id: string
  name: SecureFieldName
  focused: boolean
  invalid: boolean
}) {
  return (
    <div className={name === 'cardNumber' ? 'sm:col-span-2' : undefined}>
      <label id={`${id}-label`} className="mb-2 block text-sm font-medium text-ink">
        {fieldLabels[name]}
      </label>
      <div
        id={id}
        aria-labelledby={`${id}-label`}
        className={cn(
          'mercado-pago-secure-field h-12 overflow-hidden rounded-md border bg-surface px-3 transition-[border-color,box-shadow]',
          invalid ? 'border-revision' : 'border-line',
          focused && 'border-brand shadow-[0_0_0_3px_rgba(184,255,79,0.2)]',
        )}
      />
    </div>
  )
}

export function MercadoPagoCardForm({
  publicKey,
  payerEmail,
  submitLabel,
  onSubmit,
}: {
  publicKey: string
  payerEmail: string
  submitLabel: string
  onSubmit: (token: string, payerEmail: string) => Promise<void>
}) {
  const generatedId = useId().replace(/:/g, '')
  const ids = useMemo<Record<SecureFieldName, string>>(
    () => ({
      cardNumber: `mp-card-number-${generatedId}`,
      expirationDate: `mp-expiration-${generatedId}`,
      securityCode: `mp-security-${generatedId}`,
    }),
    [generatedId],
  )
  const mercadoPagoRef = useRef<MercadoPagoInstance | null>(null)
  const [holderName, setHolderName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [readyCount, setReadyCount] = useState(0)
  const [focusedField, setFocusedField] = useState<SecureFieldName | null>(null)
  const [invalidFields, setInvalidFields] = useState<Set<SecureFieldName>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!window.MercadoPago) {
      setError('O formulário seguro do Mercado Pago não foi carregado.')
      return
    }
    const mercadoPago = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
    mercadoPagoRef.current = mercadoPago
    const instances: MercadoPagoFieldInstance[] = []
    const styles = {
      // O iframe seguro e branco do provedor recebe inversao visual via CSS.
      // As cores abaixo sao definidas antes dessa inversao.
      color: '#0a0805',
      fontFamily: 'Instrument Sans, Arial, sans-serif',
      fontSize: '15px',
      height: '46px',
      padding: '0',
      placeholderColor: '#807668',
    }

    const createField = (name: SecureFieldName, placeholder: string) => {
      const instance = mercadoPago.fields
        .create(name, {
          placeholder,
          style: styles,
          srLabel: fieldLabels[name],
          ariaRequired: true,
        })
        .mount(ids[name])
      instance.on('ready', () => setReadyCount((count) => count + 1))
      instance.on('focus', () => setFocusedField(name))
      instance.on('blur', () => setFocusedField((current) => (current === name ? null : current)))
      instance.on('validityChange', (event) => {
        setInvalidFields((current) => {
          const next = new Set(current)
          if (event.errorMessages?.length) next.add(name)
          else next.delete(name)
          return next
        })
      })
      instances.push(instance)
      return instance
    }

    const cardNumber = createField('cardNumber', '0000 0000 0000 0000')
    createField('expirationDate', 'MM/AA')
    const securityCode = createField('securityCode', 'CVV')

    cardNumber.on('binChange', (event) => {
      if (!event.bin) return
      void mercadoPago
        .getPaymentMethods({ bin: event.bin })
        .then(({ results }) => {
          const settings = results[0]?.settings?.[0]
          if (settings?.card_number) cardNumber.update({ settings: settings.card_number })
          if (settings?.security_code) securityCode.update({ settings: settings.security_code })
        })
        .catch(() => undefined)
    })

    return () => {
      mercadoPagoRef.current = null
      for (const instance of instances) instance.unmount()
    }
  }, [ids, publicKey])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!holderName.trim() || !documentNumber.replace(/\D/g, '')) {
      setError('Informe o nome e o CPF do titular do cartão.')
      return
    }
    if (readyCount < 3 || !mercadoPagoRef.current) {
      setError('Aguarde o carregamento dos campos seguros.')
      return
    }
    setSubmitting(true)
    try {
      const token = await mercadoPagoRef.current.fields.createCardToken({
        cardholderName: holderName.trim(),
        identificationType: 'CPF',
        identificationNumber: documentNumber.replace(/\D/g, ''),
      })
      if (!token?.id) throw new Error('O Mercado Pago não gerou o token do cartão.')
      await onSubmit(token.id, payerEmail)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a assinatura.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="grid gap-5 rounded-lg border border-line bg-surface-secondary p-4 sm:p-5"
      onSubmit={submit}
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-brand" aria-hidden="true" />
        <h4 className="font-semibold text-ink">Cartão de crédito</h4>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(ids) as SecureFieldName[]).map((name) => (
          <SecureField
            key={name}
            id={ids[name]}
            name={name}
            focused={focusedField === name}
            invalid={invalidFields.has(name)}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_0.42fr_1fr]">
        <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-3">
          Nome do titular como aparece no cartão
          <input
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            autoComplete="cc-name"
            className="min-h-12 rounded-md border border-line bg-surface px-3 text-ink placeholder:text-muted hover:border-line-strong focus:border-brand focus:outline-none"
            placeholder="Nome completo"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink sm:col-span-3">
          Documento do titular
          <span className="flex min-h-12 overflow-hidden rounded-md border border-line bg-surface focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(184,255,79,0.2)]">
            <span className="flex items-center border-r border-line px-3 text-sm text-secondary">
              CPF
            </span>
            <input
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-3 text-ink placeholder:text-muted focus:outline-none"
              placeholder="000.000.000-00"
              required
            />
          </span>
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-revision/30 bg-revision-soft p-3 text-sm text-revision"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={submitting}
        icon={<LockKeyhole className="h-4 w-4" />}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
