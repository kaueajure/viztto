import { json, requisicaoApi } from './clienteHttp'

export type PlanoAssinatura = {
  id: string
  codigo: 'freelancer' | 'studio' | 'agency'
  nome: string
  descricao: string
  valorMensal: string | number
  moeda: string
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

export const assinaturasApi = {
  listarPlanos: () =>
    requisicaoApi<{
      dados: PlanoAssinatura[]
      assinaturaAtual: PlanoAssinatura['codigo'] | null
      integracao: CheckoutConfig
    }>('/api/assinaturas/planos'),
  criarAssinatura: (entrada: {
    codigoPlano: PlanoAssinatura['codigo']
    tokenCartao: string
    emailPagador: string
  }) =>
    requisicaoApi<{ dado: { id: string; status: string } }>('/api/assinaturas/criar', {
      method: 'POST',
      body: json(entrada),
    }),
  listarPlanosAdmin: () =>
    requisicaoApi<{ dados: PlanoAssinatura[]; integracao: IntegracaoMercadoPago }>(
      '/api/assinaturas/admin/planos',
    ),
  atualizarPlano: (codigo: PlanoAssinatura['codigo'], valorMensal: number, ativo: boolean) =>
    requisicaoApi<{ mensagem: string }>(`/api/assinaturas/admin/planos/${codigo}`, {
      method: 'PATCH',
      body: json({ valorMensal, ativo }),
    }),
  sincronizarPlano: (codigo: PlanoAssinatura['codigo']) =>
    requisicaoApi<{ mensagem: string }>(`/api/assinaturas/admin/planos/${codigo}/sincronizar`, {
      method: 'POST',
    }),
}
