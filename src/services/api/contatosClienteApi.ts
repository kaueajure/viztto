import { json, requisicaoApi } from '@/services/api/clienteHttp'

export type ContatoCliente = {
  id: string
  workspaceId: string
  clienteId: string
  nome: string
  email: string
  podeComentar: boolean
  podeSolicitarAlteracoes: boolean
  podeAprovar: boolean
}

export type ContatoClienteInput = {
  nome: string
  email: string
  podeComentar?: boolean
  podeSolicitarAlteracoes?: boolean
  podeAprovar?: boolean
}

export const contatosClienteApi = {
  listar: (clienteId: string) =>
    requisicaoApi<{ dados: ContatoCliente[] }>(`/api/clientes/${clienteId}/contatos`),

  criar: (clienteId: string, dados: ContatoClienteInput) =>
    requisicaoApi<{ dado: ContatoCliente }>(`/api/clientes/${clienteId}/contatos`, {
      method: 'POST',
      body: json(dados),
    }),

  atualizar: (clienteId: string, contatoId: string, dados: Partial<ContatoClienteInput>) =>
    requisicaoApi<{ mensagem: string }>(`/api/clientes/${clienteId}/contatos/${contatoId}`, {
      method: 'PATCH',
      body: json(dados),
    }),

  remover: (clienteId: string, contatoId: string) =>
    requisicaoApi<void>(`/api/clientes/${clienteId}/contatos/${contatoId}`, {
      method: 'DELETE',
    }),
}
