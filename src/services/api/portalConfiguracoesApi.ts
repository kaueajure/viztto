import type { PortalBrand } from '@/lib/portalBrand'
import { json, requisicaoApi } from './clienteHttp'

export type EscopoPortal = 'workspace' | 'cliente' | 'projeto'
export type PortalConfiguracaoResposta = {
  dado: {
    configuracao: PortalBrand
    configuracaoPropria: Partial<PortalBrand> | null
    herdando: boolean
    protegido: boolean
    expiraEm: string | null
  }
}

export type PortalConfiguracaoSalvaResposta = {
  mensagem: string
  dado: {
    protegido: boolean
    expiraEm: string | null
    linkAlterado: boolean
  } | null
}

const base = (escopo: EscopoPortal, id: string) => `/api/portal-configuracoes/${escopo}/${id}`

export const portalConfiguracoesApi = {
  carregar: (escopo: EscopoPortal, id: string) =>
    requisicaoApi<PortalConfiguracaoResposta>(base(escopo, id), { cache: 'no-store' }),
  salvar: (
    escopo: EscopoPortal,
    id: string,
    entrada: {
      herdar?: boolean
      configuracao?: Partial<PortalBrand>
      senha?: string | null
      expiraEm?: string | null
    },
  ) =>
    requisicaoApi<PortalConfiguracaoSalvaResposta>(base(escopo, id), {
      method: 'PATCH',
      body: json(entrada),
    }),
  enviarAsset: (escopo: EscopoPortal, id: string, campo: string, arquivo: File) => {
    const corpo = new FormData()
    corpo.set('imagem', arquivo)
    return requisicaoApi(`${base(escopo, id)}/assets/${campo}`, { method: 'POST', body: corpo })
  },
  removerAsset: (escopo: EscopoPortal, id: string, campo: string) =>
    requisicaoApi(`${base(escopo, id)}/assets/${campo}`, { method: 'DELETE' }),
}
