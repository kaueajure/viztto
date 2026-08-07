type MercadoPagoFieldEvent = {
  bin?: string | null
  errorMessages?: Array<{ message: string; cause: string }>
}

type MercadoPagoFieldInstance = {
  mount: (containerId: string) => MercadoPagoFieldInstance
  unmount: () => void
  on: (event: string, callback: (event: MercadoPagoFieldEvent) => void) => void
  update: (properties: Record<string, unknown>) => void
}

type MercadoPagoInstance = {
  fields: {
    create: (
      type: 'cardNumber' | 'expirationDate' | 'securityCode',
      options: Record<string, unknown>,
    ) => MercadoPagoFieldInstance
    createCardToken: (data: {
      cardholderName: string
      identificationType: string
      identificationNumber: string
    }) => Promise<{ id?: string } | undefined>
  }
  getPaymentMethods: (data: { bin: string }) => Promise<{
    results: Array<{
      settings?: Array<{
        card_number?: Record<string, unknown>
        security_code?: Record<string, unknown>
      }>
    }>
  }>
}

interface Window {
  MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance
}
