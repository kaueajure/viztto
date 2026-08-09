type ErroApi = { erro?: { mensagem?: string; codigo?: string; detalhes?: unknown } }

let tokenCsrf = ''
let csrfEmAndamento: Promise<string> | null = null

async function obterCsrf() {
  if (tokenCsrf) return tokenCsrf
  if (csrfEmAndamento) return csrfEmAndamento
  csrfEmAndamento = fetch('/api/autenticacao/csrf', {
    credentials: 'include',
    cache: 'no-store',
  })
    .then(async (resposta) => {
      if (!resposta.ok) throw new Error('Nao foi possivel iniciar uma conexao segura.')
      const recebido = String(((await resposta.json()) as { token: string }).token)
      tokenCsrf = recebido
      return recebido
    })
    .finally(() => {
      csrfEmAndamento = null
    })
  return csrfEmAndamento
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
  const mutacao = !['GET', 'HEAD', 'OPTIONS'].includes(metodo)

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const headers = new Headers(init.headers)
    if (!(init.body instanceof FormData) && init.body && !headers.has('content-type'))
      headers.set('content-type', 'application/json')
    const csrfUsado = mutacao ? await obterCsrf() : ''
    if (mutacao) headers.set('x-csrf-token', csrfUsado)

    const resposta = await fetch(caminho, { ...init, headers, credentials: 'include' })
    if (resposta.status === 204) return undefined as T
    const conteudo = (await resposta.json().catch(() => ({}))) as T & ErroApi
    const codigo = conteudo.erro?.codigo ?? 'erro_api'
    if (!resposta.ok && mutacao && resposta.status === 403 && codigo === 'csrf_invalido') {
      if (tokenCsrf === csrfUsado) tokenCsrf = ''
      if (tentativa === 0) continue
    }
    if (!resposta.ok)
      throw new ApiError(
        resposta.status,
        codigo,
        conteudo.erro?.mensagem ?? 'Nao foi possivel concluir.',
        conteudo.erro?.detalhes,
      )
    return conteudo
  }

  throw new ApiError(403, 'csrf_invalido', 'Nao foi possivel renovar a conexao segura.')
}

export const json = (dados: unknown) => JSON.stringify(dados)
export function limparCsrf() {
  tokenCsrf = ''
}
