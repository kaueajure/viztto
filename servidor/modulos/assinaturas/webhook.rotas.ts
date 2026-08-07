import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import {
  assinaturas,
  eventosWebhookMercadoPago,
  planosAssinatura,
  workspaces,
} from '../../banco/esquema/index.js'
import { novoId } from '../../utilitarios/seguranca.js'
import {
  obterAssinaturaMercadoPago,
  obterPagamentoMercadoPago,
  validarAssinaturaWebhook,
} from '../../integracoes/mercado-pago.js'

export const webhookMercadoPagoRotas = Router()

async function liberarPlanoDaAssinatura(assinatura: typeof assinaturas.$inferSelect) {
  await banco
    .update(assinaturas)
    .set({ status: 'autorizada', atualizadoEm: new Date() })
    .where(eq(assinaturas.id, assinatura.id))
  const [plano] = await banco
    .select()
    .from(planosAssinatura)
    .where(eq(planosAssinatura.id, assinatura.planoAssinaturaId))
    .limit(1)
  if (plano)
    await banco
      .update(workspaces)
      .set({ plano: plano.codigo, atualizadoEm: new Date() })
      .where(eq(workspaces.id, assinatura.workspaceId))
}

webhookMercadoPagoRotas.post('/', async (req, res) => {
  const recursoId = String(req.body?.data?.id ?? req.query['data.id'] ?? '')
  const tipo = String(req.body?.type ?? req.query.topic ?? req.query.type ?? 'desconhecido')
  const eventoId = String(
    req.body?.id ?? `${tipo}:${recursoId}:${req.body?.action ?? ''}`,
  )
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
    const status =
      remoto.status === 'authorized'
        ? 'autorizada'
        : remoto.status === 'cancelled'
          ? 'cancelada'
          : remoto.status === 'paused'
            ? 'pausada'
            : 'pendente'
    const [assinatura] = await banco
      .select()
      .from(assinaturas)
      .where(eq(assinaturas.mercadoPagoAssinaturaId, remoto.id))
      .limit(1)
    if (assinatura) {
      await banco
        .update(assinaturas)
        .set({ status, atualizadoEm: new Date() })
        .where(eq(assinaturas.id, assinatura.id))
      if (status === 'autorizada') await liberarPlanoDaAssinatura(assinatura)
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
      if (pagamento.status === 'approved') await liberarPlanoDaAssinatura(assinatura)
      else if (pagamento.status === 'cancelled' || pagamento.status === 'rejected')
        await banco
          .update(assinaturas)
          .set({ status: 'erro', atualizadoEm: new Date() })
          .where(eq(assinaturas.id, assinatura.id))
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
