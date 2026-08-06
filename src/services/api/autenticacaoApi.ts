import { json, limparCsrf, requisicaoApi } from './clienteHttp'

export type SessaoApi = {
  sessao: {
    usuarioId: string
    usuarioNome: string
    usuarioEmail: string
    workspaceId: string
    funcao: string
    admin: boolean
  }
}
export type WorkspaceListaApi = {
  dados: Array<{ id: string; nome: string; slug: string; plano: string }>
}
export const autenticacaoApi = {
  sessao: () => requisicaoApi<SessaoApi>('/api/autenticacao/sessao'),
  entrar: (email: string, senha: string) =>
    requisicaoApi('/api/autenticacao/entrar', { method: 'POST', body: json({ email, senha }) }),
  cadastrar: (nome: string, email: string, senha: string) =>
    requisicaoApi<{ mensagem: string; tokenVerificacao?: string }>('/api/autenticacao/cadastro', {
      method: 'POST',
      body: json({ nome, email, senha }),
    }),
  verificar: (token: string) =>
    requisicaoApi<{ usuarioId: string; nome: string; email: string; workspaceId?: string }>(
      '/api/autenticacao/verificar-email',
      {
        method: 'POST',
        body: json({ token }),
      },
    ),
  reenviarVerificacao: (email: string) =>
    requisicaoApi<{ mensagem: string; tokenVerificacao?: string }>(
      '/api/autenticacao/reenviar-verificacao',
      {
        method: 'POST',
        body: json({ email }),
      },
    ),
  esqueciSenha: (email: string) =>
    requisicaoApi<{ mensagem: string; tokenRecuperacao?: string }>(
      '/api/autenticacao/esqueci-senha',
      {
        method: 'POST',
        body: json({ email }),
      },
    ),
  redefinirSenha: (token: string, senha: string) =>
    requisicaoApi<{ mensagem: string }>('/api/autenticacao/redefinir-senha', {
      method: 'POST',
      body: json({ token, senha }),
    }),
  aceitarConvite: (token: string) =>
    requisicaoApi<{ mensagem: string; workspaceId: string }>('/api/autenticacao/aceitar-convite', {
      method: 'POST',
      body: json({ token }),
    }),
  onboarding: (usuarioId: string, nome: string, slug: string, tipo: string) =>
    requisicaoApi('/api/autenticacao/onboarding', {
      method: 'POST',
      body: json({ usuarioId, nome, slug, tipo }),
    }),
  slugDisponivel: (slug: string) =>
    requisicaoApi<{ disponivel: boolean }>(
      `/api/autenticacao/slug-disponivel?slug=${encodeURIComponent(slug)}`,
    ),
  trocarWorkspace: (workspaceId: string) =>
    requisicaoApi<{ workspaceId: string }>('/api/autenticacao/trocar-workspace', {
      method: 'POST',
      body: json({ workspaceId }),
    }),
  listarWorkspaces: () => requisicaoApi<WorkspaceListaApi>('/api/workspaces'),
  async sair() {
    await requisicaoApi('/api/autenticacao/sair', { method: 'POST' })
    limparCsrf()
  },
}
