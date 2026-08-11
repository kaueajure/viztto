import { ErroHttp } from '../middlewares/erros.js'

export type StatusMaterialWorkflow =
  | 'rascunho'
  | 'aguardando_revisao'
  | 'alteracoes_solicitadas'
  | 'aguardando_aprovacao'
  | 'aprovado'

export type AcaoWorkflowMaterial =
  | 'enviar_para_aprovacao'
  | 'solicitar_alteracoes'
  | 'aprovar'
  | 'criar_nova_versao'
  | 'reabrir'

const TRANSICOES: Record<AcaoWorkflowMaterial, StatusMaterialWorkflow[]> = {
  enviar_para_aprovacao: ['rascunho', 'alteracoes_solicitadas'],
  solicitar_alteracoes: ['aguardando_revisao'],
  aprovar: ['aguardando_revisao'],
  criar_nova_versao: ['rascunho', 'alteracoes_solicitadas', 'aguardando_revisao', 'aprovado'],
  reabrir: ['aprovado', 'alteracoes_solicitadas'],
}

const DESTINO: Record<AcaoWorkflowMaterial, StatusMaterialWorkflow> = {
  enviar_para_aprovacao: 'aguardando_revisao',
  solicitar_alteracoes: 'alteracoes_solicitadas',
  aprovar: 'aprovado',
  criar_nova_versao: 'rascunho',
  reabrir: 'aguardando_revisao',
}

export function statusDestinoWorkflow(acao: AcaoWorkflowMaterial): StatusMaterialWorkflow {
  return DESTINO[acao]
}

export function garantirTransicaoMaterial(
  statusAtual: StatusMaterialWorkflow | string,
  acao: AcaoWorkflowMaterial,
) {
  const permitidos = TRANSICOES[acao]
  if (!permitidos.includes(statusAtual as StatusMaterialWorkflow)) {
    throw new ErroHttp(
      409,
      `Transicao invalida: nao e possivel ${acao} a partir do status "${statusAtual}".`,
      'transicao_invalida',
      { statusAtual, acao, permitidos },
    )
  }
  return DESTINO[acao]
}

/** Materiais visíveis no portal do Cliente 2 (não rascunho). */
export function materialVisivelNoPortal(status: string) {
  return status !== 'rascunho'
}
