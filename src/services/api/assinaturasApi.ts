import { requisicaoApi, json } from './clienteHttp'

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
  permiteIdentidadePersonalizada: boolean
  permitePortalWhiteLabel: boolean
  permiteCalendarioEditorial: boolean
  permiteRelatorios: boolean
  mercadoPagoPlanoId: string | null
  mercadoPagoStatus: string | null
  ativo: boolean
  atualizadoEm: string
}

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
  recursos: {
    permiteIdentidadePersonalizada: boolean
    permitePortalWhiteLabel: boolean
    permiteCalendarioEditorial: boolean
    permiteRelatorios: boolean
  }
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
  permiteIdentidadePersonalizada: boolean
  permitePortalWhiteLabel: boolean
  permiteCalendarioEditorial: boolean
  permiteRelatorios: boolean
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
    permitePortalWhiteLabel: Boolean(plano.permitePortalWhiteLabel),
    permiteCalendarioEditorial: Boolean(plano.permiteCalendarioEditorial),
    permiteRelatorios: Boolean(plano.permiteRelatorios),
  }
}

export const assinaturasApi = {
  listarPlanos: async () => {
    const response = await requisicaoApi<{
      dados: PlanoAssinatura[]
      assinaturaAtual: PlanoAssinatura['codigo'] | null
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
  statusAssinatura: (id: string) =>
    requisicaoApi<{
      dado: { id: string; status: string; codigoPlano: PlanoAssinatura['codigo'] | null }
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
