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
}

export const assinaturasApi = {
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
