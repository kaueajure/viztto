import { and, eq, isNull } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { materiais, projetos } from '../banco/esquema/index.js'

export type StatusMaterialAgregacao =
  | 'rascunho'
  | 'em_revisao'
  | 'alteracoes_solicitadas'
  | 'aguardando_aprovacao'
  | 'aprovado'

export type StatusProjetoAgregado =
  | 'rascunho'
  | 'em_andamento'
  | 'em_revisao'
  | 'alteracoes_solicitadas'
  | 'aguardando_aprovacao'
  | 'aprovado'

/**
 * Agrega status do projeto a partir dos materiais ativos.
 * Prioridade:
 * 1. alteracoes_solicitadas
 * 2. em_revisao
 * 3. aguardando_aprovacao
 * 4. todos aprovados → aprovado
 * 5. só rascunhos → rascunho
 * 6. caso contrário → em_andamento
 */
export function agregarStatusProjetoPorMateriais(
  statusMateriais: StatusMaterialAgregacao[],
): StatusProjetoAgregado | null {
  if (!statusMateriais.length) return null

  if (statusMateriais.some((status) => status === 'alteracoes_solicitadas'))
    return 'alteracoes_solicitadas'
  if (statusMateriais.some((status) => status === 'em_revisao')) return 'em_revisao'
  if (statusMateriais.some((status) => status === 'aguardando_aprovacao'))
    return 'aguardando_aprovacao'
  if (statusMateriais.every((status) => status === 'aprovado')) return 'aprovado'
  if (statusMateriais.every((status) => status === 'rascunho')) return 'rascunho'
  return 'em_andamento'
}

type Tx = Parameters<Parameters<typeof banco.transaction>[0]>[0]

/**
 * Recalcula e persiste o status do projeto com base nos materiais ativos.
 * Não altera projetos arquivados.
 */
export async function recalcularStatusProjeto(
  projetoId: string,
  agora: Date = new Date(),
  tx?: Tx,
) {
  const db = tx ?? banco
  const [projeto] = await db
    .select({ id: projetos.id, status: projetos.status })
    .from(projetos)
    .where(and(eq(projetos.id, projetoId), isNull(projetos.excluidoEm)))
    .limit(1)
  if (!projeto) return null
  if (projeto.status === 'arquivado') return 'arquivado' as const

  const lista = await db
    .select({ status: materiais.status })
    .from(materiais)
    .where(and(eq(materiais.projetoId, projetoId), isNull(materiais.excluidoEm)))

  const agregado = agregarStatusProjetoPorMateriais(
    lista.map((item) => item.status as StatusMaterialAgregacao),
  )
  if (!agregado || agregado === projeto.status) return agregado ?? projeto.status

  await db
    .update(projetos)
    .set({ status: agregado, atualizadoEm: agora })
    .where(eq(projetos.id, projetoId))

  return agregado
}

export function progressoProjeto(aprovados: number, total: number) {
  if (total <= 0) return { progress: 0, approvedMaterialCount: 0, materialCount: 0 }
  return {
    progress: Math.round((aprovados / total) * 100),
    approvedMaterialCount: aprovados,
    materialCount: total,
  }
}
