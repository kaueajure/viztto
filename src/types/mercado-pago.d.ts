type MercadoPagoCardFormData = {
  token?: string
  payer?: { email?: string }
}

type MercadoPagoBrickController = { unmount: () => void }

type MercadoPagoBrickBuilder = {
  create: (
    type: 'cardPayment',
    containerId: string,
    settings: {
      initialization: { amount: number; payer?: { email?: string } }
      customization?: Record<string, unknown>
      callbacks: {
        onReady: () => void
        onSubmit: (data: MercadoPagoCardFormData) => Promise<void>
        onError: (error: unknown) => void
      }
    },
  ) => Promise<MercadoPagoBrickController>
}

interface Window {
  MercadoPago?: new (
    publicKey: string,
    options?: { locale?: string },
  ) => { bricks: () => MercadoPagoBrickBuilder }
}
