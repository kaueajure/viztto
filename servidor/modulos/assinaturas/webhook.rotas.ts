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
  validarAssinaturaWebhook,
} from '../../integracoes/mercado-pago.js'

export const webhookMercadoPagoRotas = Router()

webhookMercadoPagoRotas.post('/', async (req, res) => {
  const recursoId = String(req.body?.data?.id ?? req.query['data.id'] ?? '')
  const eventoId = String(
    req.body?.id ?? `${req.body?.type ?? 'evento'}:${recursoId}:${req.body?.action ?? ''}`,
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
      tipo: String(req.body?.type ?? 'desconhecido'),
      acao: req.body?.action ? String(req.body.action) : null,
      recursoExternoId: recursoId || null,
      assinaturaValida: true,
      criadoEm: new Date(),
    })
    .onDuplicateKeyUpdate({ set: { assinaturaValida: true } })

  if (req.body?.type === 'subscription_preapproval' && recursoId) {
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
      if (status === 'autorizada') {
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
    }
  }
  await banco
    .update(eventosWebhookMercadoPago)
    .set({ processadoEm: new Date() })
    .where(eq(eventosWebhookMercadoPago.eventoExternoId, eventoId))
  res.status(200).json({ recebido: true, ambiente: ambiente.MERCADO_PAGO_AMBIENTE })
})
