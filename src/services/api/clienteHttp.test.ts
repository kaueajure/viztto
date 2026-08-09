import { beforeEach, describe, expect, it, vi } from 'vitest'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('cliente HTTP', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('compartilha uma unica emissao de CSRF entre mutacoes simultaneas', async () => {
    let emissoes = 0
    const fetchMock = vi.fn(async (entrada: string | URL | Request, init?: RequestInit) => {
      const url = String(entrada)
      if (url === '/api/autenticacao/csrf') {
        emissoes += 1
        return jsonResponse({ token: 'csrf-compartilhado' })
      }
      expect(new Headers(init?.headers).get('x-csrf-token')).toBe('csrf-compartilhado')
      return jsonResponse({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { requisicaoApi } = await import('./clienteHttp')

    await Promise.all([
      requisicaoApi('/api/primeira', { method: 'POST', body: '{}' }),
      requisicaoApi('/api/segunda', { method: 'DELETE' }),
    ])

    expect(emissoes).toBe(1)
  })

  it('renova o CSRF e repete uma vez a mutacao quando o token expira', async () => {
    let emissao = 0
    let mutacao = 0
    const corpo = new FormData()
    corpo.set('imagem', new Blob(['imagem'], { type: 'image/png' }), 'imagem.png')
    const fetchMock = vi.fn(async (entrada: string | URL | Request, init?: RequestInit) => {
      const url = String(entrada)
      if (url === '/api/autenticacao/csrf') {
        emissao += 1
        return jsonResponse({ token: `csrf-${emissao}` })
      }
      mutacao += 1
      expect(init?.body).toBe(corpo)
      if (mutacao === 1)
        return jsonResponse(
          { erro: { codigo: 'csrf_invalido', mensagem: 'Token CSRF inválido.' } },
          403,
        )
      expect(new Headers(init?.headers).get('x-csrf-token')).toBe('csrf-2')
      return jsonResponse({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { requisicaoApi } = await import('./clienteHttp')

    await expect(requisicaoApi('/api/imagem', { method: 'POST', body: corpo })).resolves.toEqual({
      ok: true,
    })
    expect(emissao).toBe(2)
    expect(mutacao).toBe(2)
  })
})
