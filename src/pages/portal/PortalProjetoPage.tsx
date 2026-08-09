import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, FolderOpen, Inbox } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import {
  PortalAccessBadge,
  PortalBrandIdentity,
  PortalBrandShell,
  type PortalBrand,
} from '@/components/portal/PortalBrand'
import { PortalMaterialThumbnail } from '@/components/portal/PortalMaterialThumbnail'
import { PortalPasswordGate } from '@/components/portal/PortalPasswordGate'
import {
  PORTAL_UNAVAILABLE_MESSAGE,
  PortalUnavailableState,
} from '@/components/portal/PortalUnavailableState'
import {
  caminhoPortalMaterial,
  caminhoPortalProjeto,
  comTokenPortal,
  UUID_RE,
} from '@/lib/portalPaths'
import { ApiError, requisicaoApi } from '@/services/api/clienteHttp'

type ResumoPortal = {
  id: string
  nome: string
  empresaNome: string
  clienteNome: string
  workspaceSlug: string
  liberado: boolean
  marca?: PortalBrand
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
  marca?: PortalBrand
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

const rotuloTipo: Record<string, string> = {
  imagem: 'Imagem',
  video: 'Vídeo',
  pdf: 'PDF',
}

export default function PortalProjetoPage() {
  const { workspaceSlug = '', projectId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const tokenPortal = searchParams.get('t')?.trim() || ''
  const [resumo, setResumo] = useState<ResumoPortal | null>(null)
  const [conteudo, setConteudo] = useState<ConteudoPortal | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [senhaNecessaria, setSenhaNecessaria] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  const slugValido = Boolean(workspaceSlug) && UUID_RE.test(projectId)

  useEffect(() => {
    if (!slugValido) {
      setCarregando(false)
      setErro(PORTAL_UNAVAILABLE_MESSAGE)
      return
    }
    if (!tokenPortal) {
      setCarregando(false)
      setErro(PORTAL_UNAVAILABLE_MESSAGE)
      return
    }
    let ativo = true
    setCarregando(true)
    setErro('')
    setSenhaNecessaria(false)
    void (async () => {
      try {
        const qs = `slug=${encodeURIComponent(workspaceSlug)}&t=${encodeURIComponent(tokenPortal)}&v=${encodeURIComponent(tokenPortal.slice(0, 12))}`
        const { dado } = await requisicaoApi<{ dado: ResumoPortal }>(
          `/api/portal/projetos/${projectId}?${qs}`,
        )
        if (!ativo) return
        setResumo(dado)
        const detalhe = await requisicaoApi<{ dado: ConteudoPortal }>(
          comTokenPortal(`/api/portal/projetos/${projectId}/conteudo`, tokenPortal),
        )
        if (!ativo) return
        setConteudo(detalhe.dado)
      } catch (error) {
        if (!ativo) return
        if (error instanceof ApiError && error.codigo === 'portal_senha_necessaria') {
          setSenhaNecessaria(true)
          setErro('')
          return
        }
        setResumo(null)
        setConteudo(null)
        setErro(
          error instanceof ApiError && [401, 403, 404, 410].includes(error.status)
            ? PORTAL_UNAVAILABLE_MESSAGE
            : 'Não foi possível abrir este projeto agora.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [workspaceSlug, projectId, slugValido, tokenPortal, tentativa])

  if (!slugValido || !tokenPortal) {
    return <PortalUnavailableState message={erro || undefined} />
  }

  if (senhaNecessaria) {
    return (
      <PortalPasswordGate
        projectId={projectId}
        token={tokenPortal}
        onUnlocked={() => setTentativa((valor) => valor + 1)}
      />
    )
  }

  if (resumo && resumo.workspaceSlug !== workspaceSlug) {
    return (
      <Navigate to={caminhoPortalProjeto(resumo.workspaceSlug, projectId, tokenPortal)} replace />
    )
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center text-secondary">
        Carregando projeto...
      </div>
    )
  }

  if (!resumo || !conteudo) {
    return <PortalUnavailableState message={erro || undefined} />
  }

  const marca = conteudo.marca ?? resumo.marca
  const materiaisVisiveis = conteudo.materiais
    .filter((material) => marca?.materiaisAprovados !== 'ocultar' || material.status !== 'aprovado')
    .sort((a, b) =>
      marca?.materiaisAprovados === 'separar'
        ? Number(a.status === 'aprovado') - Number(b.status === 'aprovado')
        : 0,
    )
  const materiaisPendentes =
    marca?.materiaisAprovados === 'separar'
      ? materiaisVisiveis.filter((material) => material.status !== 'aprovado')
      : materiaisVisiveis
  const materiaisAprovados =
    marca?.materiaisAprovados === 'separar'
      ? materiaisVisiveis.filter((material) => material.status === 'aprovado')
      : []
  const renderizarCards = (lista: typeof conteudo.materiais) =>
    lista.map((material) => (
      <Link
        className="group flex min-h-28 items-center justify-between gap-3 rounded-lg border border-line bg-surface/80 p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:bg-surface-elevated focus-visible:border-brand sm:gap-4"
        to={caminhoPortalMaterial(workspaceSlug, projectId, material.id, tokenPortal)}
        key={material.id}
      >
        <div className="flex min-w-0 items-center gap-3">
          <PortalMaterialThumbnail
            type={material.tipo}
            title={material.nome}
            imageUrl={
              material.imagemUrl
                ? comTokenPortal(material.imagemUrl, tokenPortal)
                : (marca?.miniaturaPadraoUrl ?? null)
            }
          />
          <div className="min-w-0">
            <p className="break-words font-semibold text-ink">{material.nome}</p>
            {(marca?.mostrarTipo !== false || marca?.mostrarVersao !== false) && (
              <p className="mt-1 text-xs leading-relaxed text-secondary">
                {marca?.mostrarTipo !== false ? (rotuloTipo[material.tipo] ?? material.tipo) : ''}
                {marca?.mostrarVersao !== false && material.versaoAtual
                  ? ` · v${material.versaoAtual}`
                  : ''}
              </p>
            )}
            {marca?.mostrarStatus !== false && (
              <p className="mt-2 text-[11px] font-medium text-muted">
                {rotuloStatus[material.status] ?? material.status}
              </p>
            )}
          </div>
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    ))

  return (
    <PortalBrandShell
      brand={marca}
      companyName={conteudo.projeto.empresaNome}
      pageTitle={conteudo.projeto.nome}
    >
      <header className="border-b border-line/80 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <PortalBrandIdentity brand={marca} companyName={conteudo.projeto.empresaNome} />
          <PortalAccessBadge />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-7 sm:py-12">
        <section className="overflow-hidden rounded-xl border border-line bg-surface/85 shadow-raised backdrop-blur">
          {marca?.capaUrl && (
            <img src={marca.capaUrl} alt="" className="h-48 w-full object-cover sm:h-64" />
          )}
          <div className="p-6 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {marca?.nomePortal ?? 'Portal do cliente'}
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  {conteudo.projeto.nome}
                </h1>
                {marca?.mostrarCliente !== false && (
                  <p className="mt-2 text-sm font-medium text-brand">
                    {conteudo.projeto.clienteNome}
                  </p>
                )}
                <p className="mt-4 max-w-2xl leading-relaxed text-secondary">
                  {conteudo.projeto.descricao ||
                    'Acesse os materiais deste projeto para comentar, solicitar ajustes ou registrar sua aprovação.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-secondary lg:max-w-xs lg:justify-end">
                {marca?.mostrarStatus !== false && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-background/60 px-3 py-2">
                    <FolderOpen className="h-3.5 w-3.5 text-brand" aria-hidden />
                    {rotuloStatus[conteudo.projeto.status] ?? conteudo.projeto.status}
                  </span>
                )}
                {marca?.mostrarPrazo !== false && conteudo.projeto.prazoEm && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-background/60 px-3 py-2">
                    <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
                    Prazo {new Date(conteudo.projeto.prazoEm).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="materiais-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Projeto
              </p>
              <h2 id="materiais-heading" className="mt-1 text-xl font-semibold">
                Materiais para revisar
              </h2>
            </div>
            <p className="text-sm text-muted">
              {materiaisVisiveis.length} {materiaisVisiveis.length === 1 ? 'material' : 'materiais'}
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {renderizarCards(materiaisPendentes)}
          </div>

          {materiaisAprovados.length > 0 && (
            <div className="mt-9">
              <h2 className="text-xl font-semibold">Materiais aprovados</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {renderizarCards(materiaisAprovados)}
              </div>
            </div>
          )}

          {!materiaisVisiveis.length && (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-surface/70 p-7 text-center sm:p-10">
              <Inbox className="mx-auto h-7 w-7 text-muted" aria-hidden />
              <p className="mt-3 font-semibold">Nenhum material</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
                Aguarde a equipe publicar.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="px-5 py-7 text-center text-xs text-muted">
        {marca?.whiteLabel ? (
          <span>
            {marca.rodapeTexto ||
              `${conteudo.projeto.empresaNome} · ${marca.nomePortal ?? 'Portal do cliente'}`}
            {marca.suporteEmail ? ` · ${marca.suporteEmail}` : ''}
            {marca.suporteTelefone ? ` · ${marca.suporteTelefone}` : ''}
            {marca.suporteWhatsapp ? ` · WhatsApp ${marca.suporteWhatsapp}` : ''}
          </span>
        ) : (
          <span>
            Portal de revisão · <span className="font-medium text-secondary">Viztto</span>
          </span>
        )}
      </footer>
    </PortalBrandShell>
  )
}
