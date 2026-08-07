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
    return 'Assinaturas de teste exigem as credenciais de producao de uma conta vendedora de teste do Mercado Pago.'
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
    const tokenIncompativel = resposta.status === 404 && motivo === 'Card token service not found'
    throw new ErroHttp(
      502,
      tokenIncompativel
        ? 'As credenciais atuais nao aceitam assinaturas recorrentes de teste. Use as credenciais de producao de uma conta vendedora de teste do Mercado Pago.'
        : motivo
          ? `O Mercado Pago recusou a operacao: ${motivo}`
          : 'O Mercado Pago recusou a operacao. Revise os dados informados.',
      'mercado_pago_erro',
      { status: resposta.status, codigo: causa?.code },
    )
  }
  return conteudo
}

type PlanoRemoto = { id: string; status?: string }
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
