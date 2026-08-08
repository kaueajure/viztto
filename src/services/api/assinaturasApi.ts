import { requisicaoApi, json } from './clienteHttp'

export type RecursosPlano = {
  permiteIdentidadePersonalizada: boolean
  permiteCalendarioEditorial: boolean
  permiteRelatorios: boolean
  permiteComentariosImagem: boolean
  permiteComentariosVideo: boolean
  permiteComentariosPdf: boolean
  permiteLinksPortalCliente: boolean
  permiteVariosAprovadores: boolean
  permiteHistoricoAvancado: boolean
  permitePrioridadeSuporte: boolean
  permiteFuncoesAvancadas: boolean
}

export type PlanoAssinatura = {
  id: string
  codigo: 'gratuito' | 'freelancer' | 'studio' | 'agency'
  nome: string
  descricao: string
  valorMensal: string | number
  moeda: string
  beneficios: string[]
  maxProjetosAtivos: number | null
  maxMembros: number | null
  maxClientes: number | null
  maxArmazenamentoGb: number | null
  maxWorkspaces: number | null
  mercadoPagoPlanoId: string | null
  mercadoPagoStatus: string | null
  ativo: boolean
  atualizadoEm: string
} & RecursosPlano

export type IntegracaoMercadoPago = {
  ambiente: 'teste' | 'producao'
  configurada: boolean
  chavePublicaConfigurada: boolean
  webhookConfigurado: boolean
  problemaConfiguracao: string | null
}

export type CheckoutConfig = {
  ambiente: 'teste' | 'producao'
  chavePublica: string | null
  configurada: boolean
  emailPagadorTeste: string | null
  problemaConfiguracao: string | null
}

export type AssinaturaBilling = {
  id: string
  status: string
  carenciaAte: string | null
  vigenciaAte: string | null
  motivoStatus: string | null
  ehPix: boolean
}

export type UsoLimitesPlano = {
  codigo: PlanoAssinatura['codigo']
  nome: string
  beneficios: string[]
  limites: {
    maxProjetosAtivos: number | null
    maxMembros: number | null
    maxClientes: number | null
    maxArmazenamentoGb: number | null
    maxWorkspaces: number | null
  }
  uso: {
    projetosAtivos: number
    membros: number
    clientes: number
    armazenamentoBytes: number
    armazenamentoGb: number
  }
  recursos: RecursosPlano
  billing?: (AssinaturaBilling & { assinaturaId: string; codigoPlano: PlanoAssinatura['codigo'] }) | null
}

export type AtualizarPlanoEntrada = {
  nome: string
  descricao: string
  valorMensal: number
  ativo: boolean
  beneficios: string[]
  maxProjetosAtivos: number | null
  maxMembros: number | null
  maxClientes: number | null
  maxArmazenamentoGb: number | null
  maxWorkspaces: number | null
} & RecursosPlano

const recursosPadrao: RecursosPlano = {
  permiteIdentidadePersonalizada: false,
  permiteCalendarioEditorial: false,
  permiteRelatorios: false,
  permiteComentariosImagem: true,
  permiteComentariosVideo: false,
  permiteComentariosPdf: false,
  permiteLinksPortalCliente: true,
  permiteVariosAprovadores: false,
  permiteHistoricoAvancado: false,
  permitePrioridadeSuporte: false,
  permiteFuncoesAvancadas: false,
}

function normalizarPlano(plano: PlanoAssinatura): PlanoAssinatura {
  return {
    ...plano,
    beneficios: Array.isArray(plano.beneficios) ? plano.beneficios : [],
    maxProjetosAtivos: plano.maxProjetosAtivos ?? null,
    maxMembros: plano.maxMembros ?? null,
    maxClientes: plano.maxClientes ?? null,
    maxArmazenamentoGb: plano.maxArmazenamentoGb ?? null,
    maxWorkspaces: plano.maxWorkspaces ?? null,
    permiteIdentidadePersonalizada: Boolean(plano.permiteIdentidadePersonalizada),
    permiteCalendarioEditorial: Boolean(plano.permiteCalendarioEditorial),
    permiteRelatorios: Boolean(plano.permiteRelatorios),
    permiteComentariosImagem:
      plano.permiteComentariosImagem ?? recursosPadrao.permiteComentariosImagem,
    permiteComentariosVideo: Boolean(plano.permiteComentariosVideo),
    permiteComentariosPdf: Boolean(plano.permiteComentariosPdf),
    permiteLinksPortalCliente:
      plano.permiteLinksPortalCliente ?? recursosPadrao.permiteLinksPortalCliente,
    permiteVariosAprovadores: Boolean(plano.permiteVariosAprovadores),
    permiteHistoricoAvancado: Boolean(plano.permiteHistoricoAvancado),
    permitePrioridadeSuporte: Boolean(plano.permitePrioridadeSuporte),
    permiteFuncoesAvancadas: Boolean(plano.permiteFuncoesAvancadas),
  }
}

export const assinaturasApi = {
  listarPlanos: async () => {
    const response = await requisicaoApi<{
      dados: PlanoAssinatura[]
      assinaturaAtual: PlanoAssinatura['codigo'] | null
      assinaturaBilling: AssinaturaBilling | null
      integracao: CheckoutConfig
    }>('/api/assinaturas/planos')
    return {
      ...response,
      dados: response.dados.map(normalizarPlano),
    }
  },
  limites: () => requisicaoApi<{ dado: UsoLimitesPlano }>('/api/assinaturas/limites'),
  criarAssinatura: (entrada: {
    codigoPlano: PlanoAssinatura['codigo']
    tokenCartao: string
    emailPagador: string
  }) =>
    requisicaoApi<{ dado: { id: string; status: string } }>('/api/assinaturas/criar', {
      method: 'POST',
      body: json(entrada),
    }),
  criarCheckout: (entrada: {
    codigoPlano: PlanoAssinatura['codigo']
    emailPagador: string
  }) =>
    requisicaoApi<{ dado: { id: string; status: string; checkoutUrl: string } }>(
      '/api/assinaturas/criar-checkout',
      {
        method: 'POST',
        body: json(entrada),
      },
    ),
  criarPix: (entrada: { codigoPlano: PlanoAssinatura['codigo']; emailPagador: string }) =>
    requisicaoApi<{
      dado: {
        id: string
        status: string
        pagamentoId: string
        qrCode: string | null
        qrCodeBase64: string | null
        ticketUrl: string | null
      }
    }>('/api/assinaturas/criar-pix', {
      method: 'POST',
      body: json(entrada),
    }),
  cancelarAssinatura: (id: string) =>
    requisicaoApi<{
      mensagem: string
      dado: { id: string; status: string; carenciaAte: string | null }
    }>(`/api/assinaturas/${id}/cancelar`, { method: 'POST' }),
  reconciliarAdmin: () =>
    requisicaoApi<{ mensagem: string; dado: { revogadas: number; processadasEm: string } }>(
      '/api/assinaturas/admin/reconciliar',
      { method: 'POST' },
    ),
  statusAssinatura: (id: string) =>
    requisicaoApi<{
      dado: {
        id: string
        status: string
        codigoPlano: PlanoAssinatura['codigo'] | null
        carenciaAte?: string | null
        vigenciaAte?: string | null
      }
    }>(`/api/assinaturas/${id}/status`),
  listarPlanosAdmin: async () => {
    const response = await requisicaoApi<{
      dados: PlanoAssinatura[]
      integracao: IntegracaoMercadoPago
    }>('/api/assinaturas/admin/planos')
    return {
      ...response,
      dados: response.dados.map(normalizarPlano),
    }
  },
  atualizarPlano: (codigo: PlanoAssinatura['codigo'], entrada: AtualizarPlanoEntrada) =>
    requisicaoApi<{ mensagem: string }>(`/api/assinaturas/admin/planos/${codigo}`, {
      method: 'PATCH',
      body: json(entrada),
    }),
  sincronizarPlano: (codigo: PlanoAssinatura['codigo']) =>
    requisicaoApi<{ mensagem: string }>(`/api/assinaturas/admin/planos/${codigo}/sincronizar`, {
      method: 'POST',
    }),
}
