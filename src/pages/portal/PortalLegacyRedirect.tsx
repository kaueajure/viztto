import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { ApiError, requisicaoApi } from '@/services/api/clienteHttp'
import { caminhoPortalMaterial, caminhoPortalProjeto } from '@/lib/portalPaths'

/** Redireciona /p/:projectId para /{slug}/{projectId}. */
export default function PortalLegacyRedirect() {
  const { projectId = '', materialId } = useParams()
  const [destino, setDestino] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    void requisicaoApi<{ dado: { workspaceSlug: string } }>(`/api/portal/projetos/${projectId}`)
      .then(({ dado }) => {
        if (!ativo) return
        setDestino(
          materialId
            ? caminhoPortalMaterial(dado.workspaceSlug, projectId, materialId)
            : caminhoPortalProjeto(dado.workspaceSlug, projectId),
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
  }, [projectId, materialId])

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
