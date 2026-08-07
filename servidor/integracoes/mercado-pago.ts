import { createHmac, timingSafeEqual } from 'node:crypto'
import { ambiente } from '../configuracao/ambiente.js'
import { ErroHttp } from '../middlewares/erros.js'

const API = 'https://api.mercadopago.com'

export function diagnosticarConfiguracaoMercadoPago() {
  if (!(ambiente.MERCADO_PAGO_ACCESS_TOKEN && ambiente.MERCADO_PAGO_PUBLIC_KEY))
    return 'Configure a Public Key e o Access Token do Mercado Pago.'
  if (ambiente.MERCADO_PAGO_AMBIENTE !== 'teste') return null
  if (
    ambiente.MERCADO_PAGO_ACCESS_TOKEN.startsWith('TEST-') ||
    ambiente.MERCADO_PAGO_PUBLIC_KEY.startsWith('TEST-')
  )
    return 'Assinaturas nao aceitam credenciais TEST-*. Use as credenciais de producao (APP_USR-*) de uma conta vendedora de teste do Mercado Pago.'
  if (!ambiente.MERCADO_PAGO_EMAIL_PAGADOR_TESTE)
    return 'Configure o e-mail da conta compradora de teste do Mercado Pago.'
  if (!ambiente.MERCADO_PAGO_EMAIL_PAGADOR_TESTE.endsWith('@testuser.com'))
    return 'O pagador de teste deve ser uma conta compradora @testuser.com do Mercado Pago.'
  return null
}

async function requisitar<T>(caminho: string, init: RequestInit): Promise<T> {
  if (!ambiente.MERCADO_PAGO_ACCESS_TOKEN)
    throw new ErroHttp(
      503,
      'Configure as credenciais de teste do Mercado Pago.',
      'mercado_pago_nao_configurado',
    )
  const resposta = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ambiente.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  })
  const conteudo = (await resposta.json().catch(() => ({}))) as T & {
    message?: string
    error?: string
    cause?: Array<{ code?: string | number; description?: string }>
  }
  if (!resposta.ok) {
    const causas = Array.isArray(conteudo.cause) ? conteudo.cause : []
    const causa = causas.find((item) => item.description)
    const motivo = causa?.description ?? conteudo.message ?? conteudo.error
    const requestId =
      resposta.headers.get('x-request-id') ??
      resposta.headers.get('x-correlation-id') ??
      undefined
    const tokenIncompativel = resposta.status === 404 && motivo === 'Card token service not found'
    const detalheCausas =
      causas.length > 0
        ? causas
            .map((item) => item.description ?? (item.code != null ? String(item.code) : ''))
            .filter(Boolean)
            .join('; ')
        : undefined
    const mensagemBase = tokenIncompativel
      ? 'As credenciais TEST-* nao suportam assinaturas com cartao. Use Public Key e Access Token APP_USR-* da conta vendedora de teste.'
      : detalheCausas || motivo
        ? `O Mercado Pago recusou a operacao: ${detalheCausas || motivo}`
        : 'O Mercado Pago recusou a operacao. Revise os dados informados.'
    throw new ErroHttp(
      502,
      requestId ? `${mensagemBase} (request_id: ${requestId})` : mensagemBase,
      'mercado_pago_erro',
      {
        status: resposta.status,
        codigo: causa?.code,
        motivo: motivo ?? undefined,
        causas,
        requestId,
      },
    )
  }
  return conteudo
}

export function erroIndicaPlanoInexistente(erro: unknown) {
  if (!(erro instanceof ErroHttp) || erro.codigo !== 'mercado_pago_erro') return false
  const detalhes = erro.detalhes as { status?: number; motivo?: string } | undefined
  const motivo = `${detalhes?.motivo ?? erro.message}`.toLowerCase()
  if (motivo.includes('does not exist') || motivo.includes('template with id')) return true
  return [401, 403, 404].includes(detalhes?.status ?? 0)
}

type PlanoRemoto = { id: string; status?: string; collector_id?: number }
type VendedorRemoto = { id: number }
export type AssinaturaRemota = {
  id: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  external_reference?: string
  init_point?: string
  sandbox_init_point?: string
}

export function criarPlanoMercadoPago(entrada: { nome: string; valor: number; backUrl: string }) {
  return requisitar<PlanoRemoto>('/preapproval_plan', {
    method: 'POST',
    body: JSON.stringify({
      reason: `Viztto ${entrada.nome}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: entrada.valor,
        currency_id: 'BRL',
      },
      back_url: entrada.backUrl,
    }),
  })
}

export function atualizarPlanoMercadoPago(
  planoId: string,
  entrada: { nome: string; valor: number; backUrl: string },
) {
  return requisitar<PlanoRemoto>(`/preapproval_plan/${encodeURIComponent(planoId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      reason: `Viztto ${entrada.nome}`,
      auto_recurring: { transaction_amount: entrada.valor, currency_id: 'BRL' },
      back_url: entrada.backUrl,
    }),
  })
}

export function obterPlanoMercadoPago(planoId: string) {
  return requisitar<PlanoRemoto>(`/preapproval_plan/${encodeURIComponent(planoId)}`, {
    method: 'GET',
  })
}

export function obterVendedorMercadoPago() {
  return requisitar<VendedorRemoto>('/users/me', { method: 'GET' })
}

export async function planoPertenceAoVendedorMercadoPago(planoId: string) {
  const vendedor = await obterVendedorMercadoPago()
  try {
    const plano = await obterPlanoMercadoPago(planoId)
    if (!plano?.id || !plano.collector_id) return false
    return String(plano.collector_id) === String(vendedor.id)
  } catch (erro) {
    if (erroIndicaPlanoInexistente(erro)) return false
    throw erro
  }
}

export function criarAssinaturaMercadoPago(entrada: {
  planoId: string
  referenciaExterna: string
  emailPagador: string
  tokenCartao: string
  motivo: string
  backUrl: string
}) {
  return requisitar<AssinaturaRemota>('/preapproval', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': entrada.referenciaExterna,
    },
    body: JSON.stringify({
      preapproval_plan_id: entrada.planoId,
      reason: entrada.motivo,
      external_reference: entrada.referenciaExterna,
      payer_email: entrada.emailPagador,
      card_token_id: entrada.tokenCartao,
      back_url: entrada.backUrl,
      status: 'authorized',
    }),
  })
}

/** Assinatura pendente sem plano associado: checkout do MP (Pix e outros meios). */
export function criarAssinaturaCheckoutMercadoPago(entrada: {
  referenciaExterna: string
  emailPagador: string
  motivo: string
  backUrl: string
  valorMensal: number
  moeda?: string
}) {
  return requisitar<AssinaturaRemota>('/preapproval', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': `${entrada.referenciaExterna}:checkout`,
    },
    body: JSON.stringify({
      reason: entrada.motivo,
      external_reference: entrada.referenciaExterna,
      payer_email: entrada.emailPagador,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: entrada.valorMensal,
        currency_id: entrada.moeda ?? 'BRL',
      },
      back_url: entrada.backUrl,
      status: 'pending',
    }),
  })
}

export function urlCheckoutAssinatura(remoto: AssinaturaRemota) {
  if (ambiente.MERCADO_PAGO_AMBIENTE === 'teste')
    return remoto.sandbox_init_point || remoto.init_point || null
  return remoto.init_point || remoto.sandbox_init_point || null
}

export function obterAssinaturaMercadoPago(id: string) {
  return requisitar<AssinaturaRemota>(`/preapproval/${encodeURIComponent(id)}`, { method: 'GET' })
}

export type PagamentoPixRemoto = {
  id: number | string
  status: string
  status_detail?: string
  external_reference?: string
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string
      qr_code_base64?: string
      ticket_url?: string
    }
  }
}

export function criarPagamentoPixMercadoPago(entrada: {
  referenciaExterna: string
  emailPagador: string
  descricao: string
  valor: number
}) {
  return requisitar<PagamentoPixRemoto>('/v1/payments', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': `${entrada.referenciaExterna}:pix`,
    },
    body: JSON.stringify({
      transaction_amount: entrada.valor,
      description: entrada.descricao,
      payment_method_id: 'pix',
      external_reference: entrada.referenciaExterna,
      payer: {
        email: entrada.emailPagador,
      },
    }),
  })
}

export function obterPagamentoMercadoPago(id: string) {
  return requisitar<PagamentoPixRemoto>(`/v1/payments/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

export function dadosPixDoPagamento(pagamento: PagamentoPixRemoto) {
  const dados = pagamento.point_of_interaction?.transaction_data
  return {
    qrCode: dados?.qr_code ?? null,
    qrCodeBase64: dados?.qr_code_base64 ?? null,
    ticketUrl: dados?.ticket_url ?? null,
  }
}

export function validarAssinaturaWebhook(entrada: {
  assinatura?: string
  requestId?: string
  recursoId?: string
}) {
  const segredo = ambiente.MERCADO_PAGO_WEBHOOK_SECRET
  if (!segredo || !entrada.assinatura || !entrada.requestId || !entrada.recursoId) return false
  const partes = Object.fromEntries(
    entrada.assinatura.split(',').map((parte) => {
      const [chave, valor] = parte.trim().split('=')
      return [chave, valor]
    }),
  )
  if (!partes.ts || !partes.v1) return false
  const manifesto = `id:${entrada.recursoId.toLowerCase()};request-id:${entrada.requestId};ts:${partes.ts};`
  const esperado = createHmac('sha256', segredo).update(manifesto).digest('hex')
  const recebido = String(partes.v1)
  if (esperado.length !== recebido.length) return false
  return timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido))
}
