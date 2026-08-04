type ErroApi = { erro?: { mensagem?: string; codigo?: string; detalhes?: unknown } }

let tokenCsrf = ''

async function obterCsrf() {
  if (tokenCsrf) return tokenCsrf
  const resposta = await fetch('/api/autenticacao/csrf', { credentials: 'include' })
  if (!resposta.ok) throw new Error('Nao foi possivel iniciar uma conexao segura.')
  tokenCsrf = String(((await resposta.json()) as { token: string }).token)
  return tokenCsrf
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    message: string,
    public detalhes?: unknown,
  ) {
    super(message)
  }
}

export async function requisicaoApi<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const metodo = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData) && init.body && !headers.has('content-type'))
    headers.set('content-type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) headers.set('x-csrf-token', await obterCsrf())
  const resposta = await fetch(caminho, { ...init, headers, credentials: 'include' })
  if (resposta.status === 204) return undefined as T
  const conteudo = (await resposta.json().catch(() => ({}))) as T & ErroApi
  if (!resposta.ok)
    throw new ApiError(
      resposta.status,
      conteudo.erro?.codigo ?? 'erro_api',
      conteudo.erro?.mensagem ?? 'Nao foi possivel concluir.',
      conteudo.erro?.detalhes,
    )
  return conteudo
}

export const json = (dados: unknown) => JSON.stringify(dados)
export function limparCsrf() {
  tokenCsrf = ''
}
