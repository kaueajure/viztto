import { json, requisicaoApi } from './clienteHttp'

export type Preferencias = {
  comentarios: boolean
  alteracoes: boolean
  aprovacoes: boolean
  prazos: boolean
  email: boolean
  sistema: boolean
}

export type Configuracoes = {
  dado: {
    perfil: { nome: string; email: string; funcao: string }
    workspace: { nome: string; slug: string; corPrincipal: string }
    preferencias: Preferencias
  }
}

export const configuracoesApi = {
  carregar: () => requisicaoApi<Configuracoes>('/api/configuracoes'),
  salvarPerfil: (nome: string) =>
    requisicaoApi('/api/configuracoes/perfil', { method: 'PATCH', body: json({ nome }) }),
  salvarWorkspace: (entrada: { nome: string; slug: string; corPrincipal: string }) =>
    requisicaoApi('/api/configuracoes/workspace', { method: 'PATCH', body: json(entrada) }),
  salvarPreferencias: (preferencias: Preferencias) =>
    requisicaoApi('/api/configuracoes/preferencias', {
      method: 'PUT',
      body: json(preferencias),
    }),
}
