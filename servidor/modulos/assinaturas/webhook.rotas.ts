import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import { assinaturas, eventosWebhookMercadoPago } from '../../banco/esquema/index.js'
import { novoId } from '../../utilitarios/seguranca.js'
import {
  obterAssinaturaMercadoPago,
  obterPagamentoMercadoPago,
  validarAssinaturaWebhook,
} from '../../integracoes/mercado-pago.js'
import {
  assinaturaEhPix,
  iniciarCarenciaAssinatura,
  liberarPlanoDaAssinatura,
} from '../../servicos/assinatura-plano.servico.js'

export const webhookMercadoPagoRotas = Router()

webhookMercadoPagoRotas.post('/', async (req, res) => {
  const recursoId = String(req.body?.data?.id ?? req.query['data.id'] ?? '')
  const tipo = String(req.body?.type ?? req.query.topic ?? req.query.type ?? 'desconhecido')
  const eventoId = String(req.body?.id ?? `${tipo}:${recursoId}:${req.body?.action ?? ''}`)
  const valida = validarAssinaturaWebhook({
    assinatura: req.get('x-signature'),
    requestId: req.get('x-request-id'),
    recursoId,
  })
  if (!valida) return res.status(401).json({ erro: { codigo: 'assinatura_webhook_invalida' } })
  await banco
    .insert(eventosWebhookMercadoPago)
    .values({
      id: novoId(),
      eventoExternoId: eventoId,
      tipo,
      acao: req.body?.action ? String(req.body.action) : null,
      recursoExternoId: recursoId || null,
      assinaturaValida: true,
      criadoEm: new Date(),
    })
    .onDuplicateKeyUpdate({ set: { assinaturaValida: true } })

  if (tipo === 'subscription_preapproval' && recursoId) {
    const remoto = await obterAssinaturaMercadoPago(recursoId)
    const [assinatura] = await banco
      .select()
      .from(assinaturas)
      .where(eq(assinaturas.mercadoPagoAssinaturaId, remoto.id))
      .limit(1)
    if (assinatura) {
      if (remoto.status === 'authorized') await liberarPlanoDaAssinatura(assinatura, { pix: false })
      else if (remoto.status === 'cancelled')
        await iniciarCarenciaAssinatura(assinatura, 'cancelamento_remoto')
      else if (remoto.status === 'paused')
        await iniciarCarenciaAssinatura(assinatura, 'assinatura_pausada')
      else
        await banco
          .update(assinaturas)
          .set({ status: 'pendente', atualizadoEm: new Date() })
          .where(eq(assinaturas.id, assinatura.id))
    }
  }

  if ((tipo === 'payment' || tipo === 'payment.created' || tipo === 'payment.updated') && recursoId) {
    const pagamento = await obterPagamentoMercadoPago(recursoId)
    const [porId] = await banco
      .select()
      .from(assinaturas)
      .where(eq(assinaturas.mercadoPagoAssinaturaId, String(pagamento.id)))
      .limit(1)
    const [porReferencia] =
      !porId && pagamento.external_reference
        ? await banco
            .select()
            .from(assinaturas)
            .where(eq(assinaturas.referenciaExterna, pagamento.external_reference))
            .limit(1)
        : [undefined]
    const assinatura = porId ?? porReferencia
    if (assinatura) {
      if (pagamento.status === 'approved')
        await liberarPlanoDaAssinatura(assinatura, { pix: assinaturaEhPix(assinatura) })
      else if (pagamento.status === 'cancelled' || pagamento.status === 'rejected')
        await iniciarCarenciaAssinatura(assinatura, 'pagamento_recusado')
      else if (pagamento.status === 'pending' || pagamento.status === 'in_process')
        await banco
          .update(assinaturas)
          .set({ status: 'pendente', atualizadoEm: new Date() })
          .where(eq(assinaturas.id, assinatura.id))
    }
  }

  await banco
    .update(eventosWebhookMercadoPago)
    .set({ processadoEm: new Date() })
    .where(eq(eventosWebhookMercadoPago.eventoExternoId, eventoId))
  res.status(200).json({ recebido: true, ambiente: ambiente.MERCADO_PAGO_AMBIENTE })
})
