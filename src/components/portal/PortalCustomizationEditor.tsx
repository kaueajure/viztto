import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select, Switch, Textarea } from '@/components/ui/FormControls'
import type { PortalBrand } from '@/lib/portalBrand'
import { normalizePortalBrandColor } from '@/lib/portalBrand'
import { ApiError } from '@/services/api/clienteHttp'
import { portalConfiguracoesApi, type EscopoPortal } from '@/services/api/portalConfiguracoesApi'

const camposConfiguracao = [
  'corPrincipal',
  'corSecundaria',
  'tema',
  'fonte',
  'estilo',
  'fundoTipo',
  'fundoCor',
  'fundoGradiente',
  'marcaDaguaOpacidade',
  'nomePortal',
  'mensagemAprovacao',
  'mensagemAlteracoes',
  'rodapeTexto',
  'suporteEmail',
  'suporteTelefone',
  'suporteWhatsapp',
  'mostrarPrazo',
  'mostrarStatus',
  'mostrarCliente',
  'mostrarTipo',
  'mostrarVersao',
  'materiaisAprovados',
] as const satisfies ReadonlyArray<keyof PortalBrand>

function normalizarTexto(valor: unknown) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
}

function montarConfiguracaoParaSalvar(config: PortalBrand) {
  const saida: Record<string, unknown> = {}
  for (const campo of camposConfiguracao) {
    const valor = config[campo]
    if (campo === 'corPrincipal' || campo === 'corSecundaria' || campo === 'fundoCor') {
      const bruta = valor == null ? '' : String(valor).trim()
      if (!bruta) continue
      const normalizada = /^#[0-9a-f]{8}$/i.test(bruta)
        ? `#${bruta.slice(1, 7)}`
        : bruta
      if (/^#[0-9a-f]{6}$/i.test(normalizada)) saida[campo] = normalizada.toLowerCase()
      continue
    }
    if (campo === 'marcaDaguaOpacidade') {
      if (valor === null || valor === undefined || valor === '') continue
      const numero = typeof valor === 'number' ? valor : Number(valor)
      if (!Number.isFinite(numero)) continue
      saida[campo] = Math.min(1, Math.max(0, numero))
      continue
    }
    if (
      campo === 'nomePortal' ||
      campo === 'mensagemAprovacao' ||
      campo === 'mensagemAlteracoes' ||
      campo === 'rodapeTexto' ||
      campo === 'suporteEmail' ||
      campo === 'suporteTelefone' ||
      campo === 'suporteWhatsapp'
    ) {
      saida[campo] = valor == null ? '' : String(valor)
      continue
    }
    if (valor === null || valor === undefined || valor === '') continue
    saida[campo] = valor
  }
  return saida
}

function mensagemErroSalvar(erro: unknown) {
  if (!(erro instanceof ApiError))
    return erro instanceof Error ? erro.message : 'Não foi possível salvar.'
  const detalhes = erro.detalhes as
    | { fieldErrors?: Record<string, string[] | undefined> }
    | undefined
  const campos = Object.entries(detalhes?.fieldErrors ?? {})
    .flatMap(([campo, mensagens]) =>
      (mensagens ?? []).map((mensagem) => `${campo}: ${mensagem}`),
    )
  if (campos.length) return `${erro.message} ${campos.slice(0, 3).join(' · ')}`
  return erro.message
}

const assets = [
  ['logoClaroUrl', 'Logo para tema claro', 'object-contain bg-[#eef1f4]'],
  ['logoEscuroUrl', 'Logo para tema escuro', 'object-contain bg-[#10151f]'],
  ['capaUrl', 'Imagem de capa', 'object-cover'],
  ['fundoImagemUrl', 'Imagem de fundo', 'object-cover'],
  ['miniaturaPadraoUrl', 'Miniatura padrão', 'object-cover'],
  ['marcaDaguaUrl', 'Marca-d’água', 'object-contain bg-surface-secondary'],
] as const

const padrao: PortalBrand = {
  corPrincipal: '#b8ff4f',
  corSecundaria: '#7c8cff',
  tema: 'escuro',
  fonte: 'instrument',
  estilo: 'suave',
  logoUrl: null,
  fundoTipo: 'gradiente',
  fundoCor: '#080b12',
  fundoGradiente: 'aurora',
  marcaDaguaOpacidade: 0.18,
  nomePortal: 'Portal do cliente',
  mensagemAprovacao: 'Material aprovado.',
  mensagemAlteracoes: 'Alterações solicitadas.',
  rodapeTexto: '',
  suporteEmail: '',
  suporteTelefone: '',
  suporteWhatsapp: '',
  mostrarPrazo: true,
  mostrarStatus: true,
  mostrarCliente: true,
  mostrarTipo: true,
  mostrarVersao: true,
  materiaisAprovados: 'mostrar',
  whiteLabel: true,
}

const tiposImagemPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp'])
const tamanhoMaximoImagem = 20 * 1024 * 1024

function paraDataLocal(valor: string) {
  const data = new Date(valor)
  if (!Number.isFinite(data.getTime())) return ''
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function PortalCustomizationEditor({ escopo, id }: { escopo: EscopoPortal; id: string }) {
  const [config, setConfig] = useState<PortalBrand>(padrao)
  const [herdando, setHerdando] = useState(false)
  const [protegido, setProtegido] = useState(false)
  const [senhaAtiva, setSenhaAtiva] = useState(false)
  const [senha, setSenha] = useState('')
  const [expiraEm, setExpiraEm] = useState('')
  const [expiracaoAtiva, setExpiracaoAtiva] = useState(false)
  const [status, setStatus] = useState('')
  const [linkNovo, setLinkNovo] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [assetEmAndamento, setAssetEmAndamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { dado } = await portalConfiguracoesApi.carregar(escopo, id)
    const recebida = dado.configuracao ?? {}
    setConfig({
      ...padrao,
      ...recebida,
      corPrincipal: normalizePortalBrandColor(recebida.corPrincipal ?? padrao.corPrincipal),
      corSecundaria: normalizePortalBrandColor(recebida.corSecundaria ?? padrao.corSecundaria),
      fundoCor: normalizePortalBrandColor(recebida.fundoCor ?? padrao.fundoCor),
      marcaDaguaOpacidade: Number.isFinite(Number(recebida.marcaDaguaOpacidade))
        ? Math.min(1, Math.max(0, Number(recebida.marcaDaguaOpacidade)))
        : padrao.marcaDaguaOpacidade,
      nomePortal: normalizarTexto(recebida.nomePortal),
      mensagemAprovacao: normalizarTexto(recebida.mensagemAprovacao),
      mensagemAlteracoes: normalizarTexto(recebida.mensagemAlteracoes),
      rodapeTexto: normalizarTexto(recebida.rodapeTexto),
      suporteEmail: normalizarTexto(recebida.suporteEmail),
      suporteTelefone: normalizarTexto(recebida.suporteTelefone),
      suporteWhatsapp: normalizarTexto(recebida.suporteWhatsapp),
    })
    setHerdando(dado.herdando)
    setProtegido(dado.protegido)
    setSenhaAtiva(dado.protegido)
    setExpiraEm(dado.expiraEm ? paraDataLocal(String(dado.expiraEm)) : '')
    setExpiracaoAtiva(Boolean(dado.expiraEm))
  }, [escopo, id])

  useEffect(() => {
    setErro('')
    void carregar().catch((e) =>
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'),
    )
  }, [carregar])

  const definir = <K extends keyof PortalBrand>(campo: K, valor: PortalBrand[K]) =>
    setConfig((atual) => ({ ...atual, [campo]: valor }))

  const salvar = async () => {
    if (
      escopo === 'projeto' &&
      senhaAtiva &&
      ((!protegido && senha.trim().length < 4) ||
        (senha.trim().length > 0 && senha.trim().length < 4))
    ) {
      setErro('Defina uma senha com pelo menos 4 caracteres para ativar a proteção.')
      return
    }
    if (escopo === 'projeto' && expiracaoAtiva) {
      const dataExpiracao = new Date(expiraEm)
      if (!expiraEm || !Number.isFinite(dataExpiracao.getTime())) {
        setErro('Escolha uma data de expiração válida ou desative a expiração do link.')
        return
      }
      if (dataExpiracao.getTime() <= Date.now()) {
        setErro('A data de expiração precisa estar no futuro.')
        return
      }
    }
    setSalvando(true)
    setErro('')
    setStatus('')
    setLinkNovo('')
    try {
      const configuracao = montarConfiguracaoParaSalvar(config)
      const resposta = await portalConfiguracoesApi.salvar(escopo, id, {
        ...(escopo !== 'workspace' && herdando
          ? { herdar: true }
          : { configuracao: configuracao as Partial<PortalBrand> }),
        ...(escopo === 'projeto'
          ? {
              ...(!senhaAtiva && protegido
                ? { senha: null }
                : senhaAtiva && senha.trim()
                  ? { senha: senha.trim() }
                  : {}),
              expiraEm: expiracaoAtiva ? new Date(expiraEm).toISOString() : null,
            }
          : {}),
      })
      setSenha('')
      await carregar()
      const link = resposta.dado?.link?.trim() || ''
      if (resposta.dado?.linkAlterado && link) {
        setLinkNovo(link)
        try {
          await navigator.clipboard.writeText(link)
          setStatus('Portal atualizado. Novo link copiado.')
        } catch {
          setStatus('Portal atualizado. Novo link gerado.')
        }
      } else {
        setStatus('Portal atualizado.')
      }
    } catch (e) {
      setErro(mensagemErroSalvar(e))
    } finally {
      setSalvando(false)
    }
  }

  const desabilitado = escopo !== 'workspace' && herdando

  return (
    <div className="grid gap-6">
      {escopo !== 'workspace' && (
        <Checkbox
          label={`Usar configuração herdada ${escopo === 'cliente' ? 'do workspace' : 'do cliente/workspace'}`}
          checked={herdando}
          onChange={setHerdando}
        />
      )}
      <fieldset disabled={desabilitado} className="grid gap-6 disabled:opacity-55">
        <section className="rounded-lg border border-line bg-surface-secondary/30 p-5">
          <h3 className="font-semibold">Aparência</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Cor principal"
              type="color"
              value={config.corPrincipal}
              onChange={(e) => definir('corPrincipal', e.target.value)}
            />
            <Input
              label="Cor secundária"
              type="color"
              value={config.corSecundaria}
              onChange={(e) => definir('corSecundaria', e.target.value)}
            />
            <Select
              label="Tema"
              value={config.tema}
              onChange={(e) => definir('tema', e.target.value as PortalBrand['tema'])}
            >
              <option value="escuro">Escuro</option>
              <option value="claro">Claro</option>
            </Select>
            <Select
              label="Tipografia"
              value={config.fonte}
              onChange={(e) => definir('fonte', e.target.value as PortalBrand['fonte'])}
            >
              <option value="instrument">Instrument Sans</option>
              <option value="serif">Serifada</option>
              <option value="sistema">Sistema</option>
            </Select>
            <Select
              label="Estilo"
              value={config.estilo}
              onChange={(e) => definir('estilo', e.target.value as PortalBrand['estilo'])}
            >
              <option value="suave">Suave</option>
              <option value="quadrado">Quadrado</option>
              <option value="pill">Arredondado</option>
            </Select>
            <Select
              label="Tipo de fundo"
              value={config.fundoTipo}
              onChange={(e) => definir('fundoTipo', e.target.value as PortalBrand['fundoTipo'])}
            >
              <option value="cor">Cor</option>
              <option value="gradiente">Gradiente</option>
              <option value="imagem">Imagem</option>
            </Select>
            {config.fundoTipo === 'cor' && (
              <Input
                label="Cor de fundo"
                type="color"
                value={config.fundoCor}
                onChange={(e) => definir('fundoCor', e.target.value)}
              />
            )}
            {config.fundoTipo === 'gradiente' && (
              <Select
                label="Gradiente"
                value={config.fundoGradiente}
                onChange={(e) =>
                  definir('fundoGradiente', e.target.value as PortalBrand['fundoGradiente'])
                }
              >
                <option value="aurora">Aurora</option>
                <option value="oceano">Oceano</option>
                <option value="por-do-sol">Pôr do sol</option>
                <option value="monocromatico">Monocromático</option>
              </Select>
            )}
            <Input
              label="Opacidade da marca-d’água"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={config.marcaDaguaOpacidade ?? ''}
              onChange={(e) => {
                const bruto = e.target.value
                if (bruto === '') {
                  definir('marcaDaguaOpacidade', undefined)
                  return
                }
                const numero = Number(bruto)
                definir('marcaDaguaOpacidade', Number.isFinite(numero) ? numero : undefined)
              }}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map(([campo, label, ajusteImagem]) => (
              <div key={campo} className="rounded-md border border-line bg-surface p-3">
                <p className="text-sm font-medium">{label}</p>
                {config[campo] && (
                  <img
                    key={config[campo]}
                    src={config[campo] ?? ''}
                    alt={`Prévia de ${label.toLowerCase()}`}
                    className={`mt-2 h-28 w-full rounded-sm border border-line ${ajusteImagem}`}
                  />
                )}
                {!config[campo] && (
                  <div className="mt-2 grid h-28 place-items-center rounded-sm border border-dashed border-line bg-surface-secondary px-3 text-center text-xs text-muted">
                    Nenhuma imagem definida
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <label
                    className={`rounded-md border border-line px-3 py-2 text-xs font-semibold ${
                      assetEmAndamento ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    {assetEmAndamento === campo
                      ? 'Enviando...'
                      : config[campo]
                        ? 'Substituir imagem'
                        : 'Escolher imagem'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={Boolean(assetEmAndamento)}
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0]
                        e.target.value = ''
                        if (!arquivo) return
                        if (!tiposImagemPermitidos.has(arquivo.type)) {
                          setErro('Use uma imagem JPEG, PNG ou WebP.')
                          return
                        }
                        if (!arquivo.size) {
                          setErro('A imagem selecionada está vazia.')
                          return
                        }
                        if (arquivo.size > tamanhoMaximoImagem) {
                          setErro('A imagem deve ter no máximo 20 MB.')
                          return
                        }
                        setErro('')
                        setStatus('')
                        setAssetEmAndamento(campo)
                        void portalConfiguracoesApi
                          .enviarAsset(escopo, id, campo, arquivo)
                          .then(({ dado }) => {
                            setConfig((atual) => ({ ...atual, [campo]: dado.url }))
                            setHerdando(false)
                            setStatus(`${label} atualizada.`)
                          })
                          .catch((err) =>
                            setErro(err instanceof Error ? err.message : 'Falha no envio.'),
                          )
                          .finally(() => setAssetEmAndamento(null))
                      }}
                    />
                  </label>
                  {config[campo] && (
                    <Button
                      variant="ghost"
                      disabled={Boolean(assetEmAndamento)}
                      onClick={() => {
                        setErro('')
                        setStatus('')
                        setAssetEmAndamento(campo)
                        void portalConfiguracoesApi
                          .removerAsset(escopo, id, campo)
                          .then(({ dado }) => {
                            setConfig((atual) => ({ ...atual, [campo]: dado.url }))
                            setStatus(`${label} removida.`)
                          })
                          .catch((err) =>
                            setErro(err instanceof Error ? err.message : 'Falha ao remover.'),
                          )
                          .finally(() => setAssetEmAndamento(null))
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface-secondary/30 p-5">
          <h3 className="font-semibold">Conteúdo e contato</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome do portal"
              value={config.nomePortal}
              onChange={(e) => definir('nomePortal', e.target.value)}
            />
            <Input
              label="Texto do rodapé"
              value={config.rodapeTexto}
              onChange={(e) => definir('rodapeTexto', e.target.value)}
            />
            <Textarea
              label="Mensagem após aprovação"
              value={config.mensagemAprovacao}
              onChange={(e) => definir('mensagemAprovacao', e.target.value)}
            />
            <Textarea
              label="Mensagem após solicitar alterações"
              value={config.mensagemAlteracoes}
              onChange={(e) => definir('mensagemAlteracoes', e.target.value)}
            />
            <Input
              label="E-mail de suporte"
              value={config.suporteEmail}
              onChange={(e) => definir('suporteEmail', e.target.value)}
            />
            <Input
              label="Telefone de suporte"
              value={config.suporteTelefone}
              onChange={(e) => definir('suporteTelefone', e.target.value)}
            />
            <Input
              label="WhatsApp de suporte"
              value={config.suporteWhatsapp}
              onChange={(e) => definir('suporteWhatsapp', e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface-secondary/30 p-5">
          <h3 className="font-semibold">Informações visíveis</h3>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
            {(
              [
                ['mostrarPrazo', 'Prazo'],
                ['mostrarStatus', 'Status'],
                ['mostrarCliente', 'Cliente'],
                ['mostrarTipo', 'Tipo do material'],
                ['mostrarVersao', 'Versão do material'],
              ] as const
            ).map(([campo, label]) => (
              <Switch
                key={campo}
                label={label}
                checked={config[campo]}
                onChange={(v) => definir(campo, v)}
              />
            ))}
          </div>
          <div className="mt-4 max-w-sm">
            <Select
              label="Materiais aprovados"
              value={config.materiaisAprovados}
              onChange={(e) =>
                definir('materiaisAprovados', e.target.value as PortalBrand['materiaisAprovados'])
              }
            >
              <option value="mostrar">Mostrar junto aos demais</option>
              <option value="separar">Separar em uma seção</option>
              <option value="ocultar">Ocultar</option>
            </Select>
          </div>
        </section>
      </fieldset>

      {escopo === 'projeto' && (
        <section className="rounded-lg border border-line bg-surface-secondary/30 p-5">
          <h3 className="font-semibold">Segurança</h3>
          <p className="mt-1 text-sm text-secondary">Senha e expiração do link.</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {protegido ? 'Senha ativa' : 'Sem senha'}
          </p>
          <div className="mt-4">
            <Switch
              label="Exigir senha"
              checked={senhaAtiva}
              onChange={(ativa) => {
                setSenhaAtiva(ativa)
                if (!ativa) setSenha('')
              }}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {senhaAtiva && (
              <Input
                label={protegido ? 'Nova senha' : 'Senha'}
                type="password"
                minLength={4}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                hint={protegido ? 'Deixe em branco para manter.' : 'Mínimo de 4 caracteres.'}
              />
            )}
            <div className="grid content-start gap-3">
              <Switch
                label="Definir expiração"
                checked={expiracaoAtiva}
                onChange={(ativa) => {
                  setExpiracaoAtiva(ativa)
                  if (!ativa) setExpiraEm('')
                }}
              />
              {expiracaoAtiva && (
                <Input
                  label="Expira em"
                  type="datetime-local"
                  value={expiraEm}
                  onChange={(e) => setExpiraEm(e.target.value)}
                  hint="Após esta data o link expira."
                />
              )}
            </div>
          </div>
          {protegido && !senhaAtiva && (
            <p className="mt-3 text-xs text-warning">
              Ao salvar, a senha será removida e um novo link será gerado.
            </p>
          )}
        </section>
      )}
      {status && (
        <p role="status" className="text-sm text-approval">
          {status}
        </p>
      )}
      {linkNovo && (
        <div className="rounded-md border border-line bg-surface-secondary/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Novo link</p>
          <p className="mt-2 break-all text-sm text-ink">{linkNovo}</p>
          <Button
            className="mt-3"
            variant="outline"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(linkNovo).then(
                () => setStatus('Link copiado'),
                () => setErro('Não foi possível copiar o link.'),
              )
            }}
          >
            Copiar link
          </Button>
        </div>
      )}
      {erro && (
        <p role="alert" className="text-sm text-revision">
          {erro}
        </p>
      )}
      <Button className="w-fit" loading={salvando} onClick={() => void salvar()}>
        Salvar personalização
      </Button>
    </div>
  )
}
