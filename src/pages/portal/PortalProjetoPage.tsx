import { LockKeyhole } from 'lucide-react'
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import { ApiError, requisicaoApi, json } from '@/services/api/clienteHttp'

type ResumoPortal = {
  id: string
  nome: string
  empresaNome: string
  clienteNome: string
  liberado: boolean
  temSenha: boolean
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
  const { projectId = '' } = useParams()
  const [resumo, setResumo] = useState<ResumoPortal | null>(null)
  const [conteudo, setConteudo] = useState<ConteudoPortal | null>(null)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const { dado } = await requisicaoApi<{ dado: ResumoPortal }>(
        `/api/portal/projetos/${projectId}`,
      )
      setResumo(dado)
      if (dado.liberado) {
        const detalhe = await requisicaoApi<{ dado: ConteudoPortal }>(
          `/api/portal/projetos/${projectId}/conteudo`,
        )
        setConteudo(detalhe.dado)
      } else {
        setConteudo(null)
      }
    } catch (error) {
      setResumo(null)
      setConteudo(null)
      setErro(error instanceof ApiError ? error.message : 'Não foi possível abrir este projeto.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [projectId])

  const entrar = async (event: FormEvent) => {
    event.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await requisicaoApi(`/api/portal/projetos/${projectId}/entrar`, {
        method: 'POST',
        body: json({ senha }),
      })
      setSenha('')
      await carregar()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Senha inválida.')
    } finally {
      setEnviando(false)
    }
  }

  const sair = async () => {
    await requisicaoApi(`/api/portal/projetos/${projectId}/sair`, { method: 'POST' })
    setConteudo(null)
    await carregar()
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center text-secondary">
        Carregando projeto...
      </div>
    )
  }

  if (!resumo) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Projeto indisponível</h1>
        <p className="mt-3 text-secondary">{erro || 'Este link não é válido.'}</p>
      </div>
    )
  }

  if (!conteudo) {
    return (
      <div
        className="mx-auto grid max-w-lg gap-6 px-5 py-16"
        style={
          resumo.marca
            ? ({ ['--portal-brand' as string]: resumo.marca.corPrincipal } as CSSProperties)
            : undefined
        }
      >
        <div className="rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">
          {resumo.marca?.logoUrl ? (
            <img src={resumo.marca.logoUrl} alt="" className="h-10 w-auto object-contain" />
          ) : (
            <span
              className="grid h-11 w-11 place-items-center rounded-lg border text-brand"
              style={{
                borderColor: 'color-mix(in srgb, var(--portal-brand, #b8ff4f) 30%, transparent)',
                background: 'color-mix(in srgb, var(--portal-brand, #b8ff4f) 18%, transparent)',
                color: 'var(--portal-brand, #b8ff4f)',
              }}
            >
              <LockKeyhole className="h-5 w-5" />
            </span>
          )}
          <p className="mt-5 text-sm text-muted">{resumo.empresaNome}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{resumo.nome}</h1>
          <p className="mt-3 text-secondary">
            Digite a senha enviada por e-mail para acessar e revisar este projeto.
          </p>
          {!resumo.temSenha && (
            <p className="mt-3 text-sm text-revision">
              Este projeto ainda não tem senha. Peça uma nova ao responsável.
            </p>
          )}
          <form onSubmit={(event) => void entrar(event)} className="mt-7 grid gap-4">
            <Input
              label="Senha de acesso"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
            {erro && <p className="text-sm text-revision">{erro}</p>}
            <Button type="submit" loading={enviando} disabled={!resumo.temSenha}>
              Entrar no projeto
            </Button>
          </form>
        </div>
        {!resumo.marca?.whiteLabel && (
          <p className="text-center text-xs text-muted">
            Portal de revisão · <span className="font-medium text-secondary">Viztto</span>
          </p>
        )}
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
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {resumo.marca?.logoUrl && (
            <img
              src={resumo.marca.logoUrl}
              alt=""
              className="mb-3 h-8 w-auto object-contain"
            />
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
        <Button variant="ghost" onClick={() => void sair()}>
          Sair
        </Button>
      </div>
      <h2 className="mt-8 text-lg font-semibold">Materiais para revisar</h2>
      <div className="mt-4 divide-y divide-line rounded-md border border-line">
        {conteudo.materiais.map((material) => (
          <Link
            className="flex items-center justify-between gap-4 p-4 hover:bg-surface-secondary"
            to={`/p/${projectId}/materiais/${material.id}`}
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
