import { createHmac, timingSafeEqual } from 'node:crypto'
import { ambiente } from '../configuracao/ambiente.js'
import { ErroHttp } from '../middlewares/erros.js'

const API = 'https://api.mercadopago.com'

export function diagnosticarConfiguracaoMercadoPago() {
  if (!(ambiente.MERCADO_PAGO_ACCESS_TOKEN && ambiente.MERCADO_PAGO_PUBLIC_KEY))
    return 'Configure a Public Key e o Access Token do Mercado Pago.'
  if (ambiente.MERCADO_PAGO_AMBIENTE !== 'teste') return null
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
    const causa = conteudo.cause?.find((item) => item.description)
    const motivo = causa?.description ?? conteudo.message ?? conteudo.error
    throw new ErroHttp(
      502,
      motivo
        ? `O Mercado Pago recusou a operacao: ${motivo}`
        : 'O Mercado Pago recusou a operacao. Revise os dados informados.',
      'mercado_pago_erro',
      {
        status: resposta.status,
        codigo: causa?.code,
        requestId:
          resposta.headers.get('x-request-id') ??
          resposta.headers.get('x-correlation-id') ??
          undefined,
      },
    )
  }
  return conteudo
}

type PlanoRemoto = { id: string; status?: string; collector_id?: number }
type VendedorRemoto = { id: number }
export type AssinaturaRemota = {
  id: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  external_reference?: string
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
    return String(plano.collector_id) === String(vendedor.id)
  } catch (erro) {
    const inacessivel =
      erro instanceof ErroHttp &&
      erro.codigo === 'mercado_pago_erro' &&
      [401, 403, 404].includes(
        (erro.detalhes as { status?: number } | undefined)?.status ?? 0,
      )
    if (inacessivel) return false
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

export function obterAssinaturaMercadoPago(id: string) {
  return requisitar<AssinaturaRemota>(`/preapproval/${encodeURIComponent(id)}`, { method: 'GET' })
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
