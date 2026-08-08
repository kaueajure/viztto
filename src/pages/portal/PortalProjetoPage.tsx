import { useEffect, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { caminhoPortalMaterial, caminhoPortalProjeto, UUID_RE } from '@/lib/portalPaths'
import { ApiError, requisicaoApi } from '@/services/api/clienteHttp'

type ResumoPortal = {
  id: string
  nome: string
  empresaNome: string
  clienteNome: string
  workspaceSlug: string
  liberado: boolean
  marca?: {
    corPrincipal: string
    logoUrl: string | null
    whiteLabel: boolean
  }
}

type ConteudoPortal = {
  projeto: {
    id: string
    nome: string
    descricao: string | null
    status: string
    tipo: string
    prazoEm: string | null
    empresaNome: string
    clienteNome: string
  }
  materiais: Array<{
    id: string
    nome: string
    tipo: string
    status: string
    versaoAtual: number | null
    arquivoId: string | null
    imagemUrl: string | null
    atualizadoEm: string
  }>
}

const rotuloStatus: Record<string, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  alteracoes_solicitadas: 'Alterações solicitadas',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  arquivado: 'Arquivado',
}

export default function PortalProjetoPage() {
  const { workspaceSlug = '', projectId = '' } = useParams()
  const [resumo, setResumo] = useState<ResumoPortal | null>(null)
  const [conteudo, setConteudo] = useState<ConteudoPortal | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const slugValido = Boolean(workspaceSlug) && UUID_RE.test(projectId)

  useEffect(() => {
    if (!slugValido) {
      setCarregando(false)
      setErro('Este link não é válido.')
      return
    }
    let ativo = true
    setCarregando(true)
    setErro('')
    void (async () => {
      try {
        const { dado } = await requisicaoApi<{ dado: ResumoPortal }>(
          `/api/portal/projetos/${projectId}?slug=${encodeURIComponent(workspaceSlug)}`,
        )
        if (!ativo) return
        setResumo(dado)
        const detalhe = await requisicaoApi<{ dado: ConteudoPortal }>(
          `/api/portal/projetos/${projectId}/conteudo`,
        )
        if (!ativo) return
        setConteudo(detalhe.dado)
      } catch (error) {
        if (!ativo) return
        setResumo(null)
        setConteudo(null)
        setErro(error instanceof ApiError ? error.message : 'Não foi possível abrir este projeto.')
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [workspaceSlug, projectId, slugValido])

  if (!slugValido) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Projeto indisponível</h1>
        <p className="mt-3 text-secondary">{erro || 'Este link não é válido.'}</p>
      </div>
    )
  }

  if (resumo && resumo.workspaceSlug !== workspaceSlug) {
    return <Navigate to={caminhoPortalProjeto(resumo.workspaceSlug, projectId)} replace />
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center text-secondary">
        Carregando projeto...
      </div>
    )
  }

  if (!resumo || !conteudo) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Projeto indisponível</h1>
        <p className="mt-3 text-secondary">{erro || 'Este link não é válido.'}</p>
      </div>
    )
  }

  return (
    <div
      className="mx-auto max-w-3xl px-5 py-10"
      style={
        resumo.marca
          ? ({ ['--portal-brand' as string]: resumo.marca.corPrincipal } as CSSProperties)
          : undefined
      }
    >
      <div className="border-b border-line pb-6">
        {resumo.marca?.logoUrl && (
          <img src={resumo.marca.logoUrl} alt="" className="mb-3 h-8 w-auto object-contain" />
        )}
        <p className="text-sm text-muted">{conteudo.projeto.empresaNome}</p>
        <h1 className="mt-1 text-3xl font-semibold">{conteudo.projeto.nome}</h1>
        <p className="mt-2 text-sm text-secondary">
          {rotuloStatus[conteudo.projeto.status] ?? conteudo.projeto.status}
          {conteudo.projeto.prazoEm
            ? ` · prazo ${new Date(conteudo.projeto.prazoEm).toLocaleDateString('pt-BR')}`
            : ''}
        </p>
        <p className="mt-3 text-sm text-secondary">
          Abra um material para comentar, pedir alterações ou aprovar.
        </p>
        {conteudo.projeto.descricao && (
          <p className="mt-3 text-secondary">{conteudo.projeto.descricao}</p>
        )}
      </div>
      <h2 className="mt-8 text-lg font-semibold">Materiais para revisar</h2>
      <div className="mt-4 divide-y divide-line rounded-md border border-line">
        {conteudo.materiais.map((material) => (
          <Link
            className="flex items-center justify-between gap-4 p-4 hover:bg-surface-secondary"
            to={caminhoPortalMaterial(workspaceSlug, projectId, material.id)}
            key={material.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              {material.imagemUrl && material.tipo === 'imagem' ? (
                <img
                  src={material.imagemUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface-secondary text-xs text-muted">
                  {material.tipo === 'video' ? 'Vídeo' : material.tipo === 'pdf' ? 'PDF' : '—'}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{material.nome}</p>
                <p className="mt-1 text-xs text-secondary">
                  {material.tipo}
                  {material.versaoAtual ? ` · v${material.versaoAtual}` : ''} ·{' '}
                  {rotuloStatus[material.status] ?? material.status}
                </p>
              </div>
            </div>
            <span
              className="shrink-0 text-sm font-semibold"
              style={{ color: 'var(--portal-brand, var(--color-brand, #b8ff4f))' }}
            >
              Revisar
            </span>
          </Link>
        ))}
        {!conteudo.materiais.length && (
          <p className="p-5 text-secondary">Nenhum material publicado ainda.</p>
        )}
      </div>
      {!resumo.marca?.whiteLabel && (
        <p className="mt-8 text-center text-xs text-muted">
          Portal de revisão · <span className="font-medium text-secondary">Viztto</span>
        </p>
      )}
    </div>
  )
}
