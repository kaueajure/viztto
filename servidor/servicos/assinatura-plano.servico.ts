import { and, desc, eq, inArray, isNotNull, lt, or } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { assinaturas, planosAssinatura, workspaces } from '../banco/esquema/index.js'
import { cancelarAssinaturaMercadoPago } from '../integracoes/mercado-pago.js'

export type AssinaturaLinha = typeof assinaturas.$inferSelect

export const DIAS_CARENCIA = 7
export const DIAS_VIGENCIA_PIX = 7

export function assinaturaEhPix(assinatura: Pick<AssinaturaLinha, 'referenciaExterna'>) {
  return assinatura.referenciaExterna.includes(':pix:')
}

function adicionarDias(base: Date, dias: number) {
  return new Date(base.getTime() + dias * 24 * 60 * 60_000)
}

/** Libera o plano do workspace e marca a assinatura como autorizada. */
export async function liberarPlanoDaAssinatura(
  assinatura: AssinaturaLinha,
  opcoes?: { pix?: boolean },
) {
  const agora = new Date()
  const pix = opcoes?.pix ?? assinaturaEhPix(assinatura)
  const vigenciaAte = pix ? adicionarDias(agora, DIAS_VIGENCIA_PIX) : null
  await banco
    .update(assinaturas)
    .set({
      status: 'autorizada',
      carenciaAte: null,
      vigenciaAte,
      motivoStatus: null,
      atualizadoEm: agora,
    })
    .where(eq(assinaturas.id, assinatura.id))
  const [plano] = await banco
    .select()
    .from(planosAssinatura)
    .where(eq(planosAssinatura.id, assinatura.planoAssinaturaId))
    .limit(1)
  if (plano)
    await banco
      .update(workspaces)
      .set({ plano: plano.codigo, atualizadoEm: agora })
      .where(eq(workspaces.id, assinatura.workspaceId))
}

/** Entra em carência de 7 dias sem revogar o plano imediatamente. */
export async function iniciarCarenciaAssinatura(assinatura: AssinaturaLinha, motivo: string) {
  if (assinatura.status === 'cancelada') return
  const agora = new Date()
  const carenciaAte =
    assinatura.carenciaAte && assinatura.carenciaAte > agora
      ? assinatura.carenciaAte
      : adicionarDias(agora, DIAS_CARENCIA)
  await banco
    .update(assinaturas)
    .set({
      status: 'pausada',
      carenciaAte,
      motivoStatus: motivo.slice(0, 80),
      atualizadoEm: agora,
    })
    .where(eq(assinaturas.id, assinatura.id))
}

async function assinaturaAtivaDoWorkspace(workspaceId: string) {
  const [atual] = await banco
    .select()
    .from(assinaturas)
    .where(
      and(
        eq(assinaturas.workspaceId, workspaceId),
        inArray(assinaturas.status, ['autorizada', 'pausada']),
      ),
    )
    .orderBy(desc(assinaturas.atualizadoEm))
    .limit(1)
  return atual ?? null
}

/** Revoga plano para gratuito se esta for a assinatura ativa do workspace. */
export async function revogarPlanoDaAssinatura(
  assinatura: AssinaturaLinha,
  motivo: string,
  statusFinal: 'cancelada' | 'erro' = 'cancelada',
) {
  const agora = new Date()
  const ativa = await assinaturaAtivaDoWorkspace(assinatura.workspaceId)
  const deveRevogarWorkspace = !ativa || ativa.id === assinatura.id
  await banco
    .update(assinaturas)
    .set({
      status: statusFinal,
      motivoStatus: motivo.slice(0, 80),
      carenciaAte: null,
      vigenciaAte: null,
      atualizadoEm: agora,
    })
    .where(eq(assinaturas.id, assinatura.id))
  if (deveRevogarWorkspace) {
    const [outra] = await banco
      .select()
      .from(assinaturas)
      .where(
        and(
          eq(assinaturas.workspaceId, assinatura.workspaceId),
          inArray(assinaturas.status, ['autorizada', 'pausada']),
        ),
      )
      .orderBy(desc(assinaturas.atualizadoEm))
      .limit(1)
    if (!outra) {
      await banco
        .update(workspaces)
        .set({ plano: 'gratuito', atualizadoEm: agora })
        .where(eq(workspaces.id, assinatura.workspaceId))
    } else if (outra.status === 'autorizada') {
      const [plano] = await banco
        .select()
        .from(planosAssinatura)
        .where(eq(planosAssinatura.id, outra.planoAssinaturaId))
        .limit(1)
      if (plano)
        await banco
          .update(workspaces)
          .set({ plano: plano.codigo, atualizadoEm: agora })
          .where(eq(workspaces.id, assinatura.workspaceId))
    }
  }
}

/**
 * Cancela/supersede assinaturas ativas anteriores do workspace
 * (evita órfãs no Mercado Pago ao criar uma nova).
 */
export async function supersedirAssinaturasAnteriores(
  workspaceId: string,
  excetoId?: string,
) {
  const ativas = await banco
    .select()
    .from(assinaturas)
    .where(
      and(
        eq(assinaturas.workspaceId, workspaceId),
        inArray(assinaturas.status, ['autorizada', 'pausada', 'pendente']),
      ),
    )
  for (const item of ativas) {
    if (excetoId && item.id === excetoId) continue
    if (!assinaturaEhPix(item) && item.mercadoPagoAssinaturaId) {
      try {
        await cancelarAssinaturaMercadoPago(item.mercadoPagoAssinaturaId)
      } catch {
        /* segue com supersessão local */
      }
    }
    await banco
      .update(assinaturas)
      .set({
        status: 'cancelada',
        motivoStatus: 'substituida_por_nova',
        carenciaAte: null,
        vigenciaAte: null,
        atualizadoEm: new Date(),
      })
      .where(eq(assinaturas.id, item.id))
  }
}

/** Processa carências e vigências PIX vencidas. */
export async function reconciliarAssinaturasVencidas() {
  const agora = new Date()
  const carenciasVencidas = await banco
    .select()
    .from(assinaturas)
    .where(
      and(
        eq(assinaturas.status, 'pausada'),
        isNotNull(assinaturas.carenciaAte),
        lt(assinaturas.carenciaAte, agora),
      ),
    )
  let revogadas = 0
  for (const item of carenciasVencidas) {
    const motivo = item.motivoStatus?.includes('pagamento')
      ? 'carencia_pagamento_esgotada'
      : 'carencia_esgotada'
    await revogarPlanoDaAssinatura(
      item,
      motivo,
      item.motivoStatus === 'pagamento_recusado' ? 'erro' : 'cancelada',
    )
    revogadas += 1
  }

  const pixVencidos = await banco
    .select()
    .from(assinaturas)
    .where(
      and(
        eq(assinaturas.status, 'autorizada'),
        isNotNull(assinaturas.vigenciaAte),
        lt(assinaturas.vigenciaAte, agora),
      ),
    )
  for (const item of pixVencidos) {
    if (!assinaturaEhPix(item)) continue
    await revogarPlanoDaAssinatura(item, 'pix_expirado', 'cancelada')
    revogadas += 1
  }

  return { revogadas, processadasEm: agora.toISOString() }
}

export async function obterAssinaturaBillingDoWorkspace(workspaceId: string) {
  const [linha] = await banco
    .select({
      id: assinaturas.id,
      status: assinaturas.status,
      carenciaAte: assinaturas.carenciaAte,
      vigenciaAte: assinaturas.vigenciaAte,
      motivoStatus: assinaturas.motivoStatus,
      codigoPlano: planosAssinatura.codigo,
      referenciaExterna: assinaturas.referenciaExterna,
    })
    .from(assinaturas)
    .innerJoin(planosAssinatura, eq(planosAssinatura.id, assinaturas.planoAssinaturaId))
    .where(
      and(
        eq(assinaturas.workspaceId, workspaceId),
        or(
          eq(assinaturas.status, 'autorizada'),
          eq(assinaturas.status, 'pausada'),
        ),
      ),
    )
    .orderBy(desc(assinaturas.atualizadoEm))
    .limit(1)
  return linha ?? null
}
