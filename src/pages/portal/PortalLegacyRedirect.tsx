import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { ApiError, requisicaoApi } from '@/services/api/clienteHttp'
import { caminhoPortalMaterial, caminhoPortalProjeto } from '@/lib/portalPaths'

/** Redireciona /p/:projectId para /{slug}/{projectId}?t=... quando o token vier na query. */
export default function PortalLegacyRedirect() {
  const { projectId = '', materialId } = useParams()
  const [searchParams] = useSearchParams()
  const tokenPortal = searchParams.get('t')?.trim() || ''
  const [destino, setDestino] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!tokenPortal) {
      setErro('Este link está incompleto. Peça um novo link de compartilhamento à equipe.')
      return
    }
    let ativo = true
    void requisicaoApi<{ dado: { workspaceSlug: string } }>(
      `/api/portal/projetos/${projectId}?t=${encodeURIComponent(tokenPortal)}`,
    )
      .then(({ dado }) => {
        if (!ativo) return
        setDestino(
          materialId
            ? caminhoPortalMaterial(dado.workspaceSlug, projectId, materialId, tokenPortal)
            : caminhoPortalProjeto(dado.workspaceSlug, projectId, tokenPortal),
        )
      })
      .catch((error) => {
        if (!ativo) return
        setErro(
          error instanceof ApiError ? error.message : 'Não foi possível abrir este projeto.',
        )
      })
    return () => {
      ativo = false
    }
  }, [projectId, materialId, tokenPortal])

  if (destino) return <Navigate to={destino} replace />

  if (erro) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Projeto indisponível</h1>
        <p className="mt-3 text-secondary">{erro}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center text-secondary">
      Redirecionando...
    </div>
  )
}
