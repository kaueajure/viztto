import { createHash } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import {
  clientes,
  projetos,
  type PortalConfiguracaoDados,
  workspaces,
} from '../banco/esquema/index.js'
import { banco } from '../configuracao/banco.js'
import { ErroHttp } from '../middlewares/erros.js'

export const camposAssetPortal = [
  'logoClaroUrl',
  'logoEscuroUrl',
  'capaUrl',
  'fundoImagemUrl',
  'miniaturaPadraoUrl',
  'marcaDaguaUrl',
] as const
export type CampoAssetPortal = (typeof camposAssetPortal)[number]
export type EscopoPortal = 'workspace' | 'cliente' | 'projeto'

/** Personalizacao: nenhum campo e obrigatorio; so limita tamanho/formato quando informado. */
const textoOpcional = (maximo: number) =>
  z.preprocess((valor) => {
    if (valor === null || valor === undefined) return ''
    return typeof valor === 'string' ? valor : String(valor)
  }, z.string().trim().max(maximo))

const cor = z.preprocess((valor) => {
  if (valor === null || valor === undefined || valor === '') return undefined
  if (typeof valor !== 'string') return valor
  const normalizada = valor.trim()
  // Alguns browsers/color pickers devolvem #RRGGBBAA — usa so RGB.
  if (/^#[0-9a-f]{8}$/i.test(normalizada)) return `#${normalizada.slice(1, 7).toLowerCase()}`
  if (/^#[0-9a-f]{6}$/i.test(normalizada)) return normalizada.toLowerCase()
  return undefined
}, z.string().regex(/^#[0-9a-f]{6}$/i).optional())

const opacidadeMarca = z.preprocess((valor) => {
  if (valor === null || valor === undefined || valor === '') return undefined
  const numero = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(numero)) return undefined
  return Math.min(1, Math.max(0, numero))
}, z.number().min(0).max(1).optional())

const enumOpcional = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess(
    (valor) => (valor === null || valor === undefined || valor === '' ? undefined : valor),
    esquema.optional(),
  )

export const configuracaoPortalEntrada = z
  .object({
    corPrincipal: cor,
    corSecundaria: cor,
    tema: enumOpcional(z.enum(['escuro', 'claro'])),
    fonte: enumOpcional(z.enum(['instrument', 'serif', 'sistema'])),
    estilo: enumOpcional(z.enum(['suave', 'quadrado', 'pill'])),
    fundoTipo: enumOpcional(z.enum(['cor', 'gradiente', 'imagem'])),
    fundoCor: cor,
    fundoGradiente: enumOpcional(z.enum(['aurora', 'oceano', 'por-do-sol', 'monocromatico'])),
    marcaDaguaOpacidade: opacidadeMarca,
    nomePortal: textoOpcional(80),
    mensagemAprovacao: textoOpcional(500),
    mensagemAlteracoes: textoOpcional(500),
    rodapeTexto: textoOpcional(300),
    suporteEmail: textoOpcional(254),
    suporteTelefone: textoOpcional(40),
    suporteWhatsapp: textoOpcional(30),
    mostrarPrazo: z.boolean().optional(),
    mostrarStatus: z.boolean().optional(),
    mostrarCliente: z.boolean().optional(),
    mostrarTipo: z.boolean().optional(),
    mostrarVersao: z.boolean().optional(),
    materiaisAprovados: enumOpcional(z.enum(['mostrar', 'separar', 'ocultar'])),
  })
  .strict()

export const configuracaoPortalPadrao: Required<Omit<PortalConfiguracaoDados, CampoAssetPortal>> &
  Record<CampoAssetPortal, string | null> = {
  corPrincipal: '#b8ff4f',
  corSecundaria: '#7c8cff',
  tema: 'escuro',
  fonte: 'instrument',
  estilo: 'suave',
  logoClaroUrl: null,
  logoEscuroUrl: null,
  capaUrl: null,
  fundoTipo: 'gradiente',
  fundoCor: '#080b12',
  fundoGradiente: 'aurora',
  fundoImagemUrl: null,
  miniaturaPadraoUrl: null,
  marcaDaguaUrl: null,
  marcaDaguaOpacidade: 0.18,
  nomePortal: 'Portal do cliente',
  mensagemAprovacao: 'Material aprovado com sucesso.',
  mensagemAlteracoes: 'Solicitacao de alteracoes enviada com sucesso.',
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
}

export function urlAssetPortal(
  escopo: EscopoPortal,
  id: string,
  campo: CampoAssetPortal,
  caminho: string,
) {
  const versao = createHash('sha256').update(caminho).digest('hex').slice(0, 12)
  return `/api/portal/personalizacao-assets/${escopo}/${id}/${campo}?v=${versao}`
}

function prepararConfig(
  config: PortalConfiguracaoDados | null | undefined,
  escopo: EscopoPortal,
  id: string,
) {
  if (!config) return null
  const saida: PortalConfiguracaoDados = { ...config }
  for (const campo of camposAssetPortal) {
    if (config[campo]) saida[campo] = urlAssetPortal(escopo, id, campo, config[campo])
  }
  return saida
}

export function mesclarConfiguracoesPortal(
  ...configuracoes: Array<PortalConfiguracaoDados | null | undefined>
) {
  return configuracoes.reduce<PortalConfiguracaoDados>(
    (acumulada, atual) => (atual ? { ...acumulada, ...atual } : acumulada),
    { ...configuracaoPortalPadrao },
  ) as typeof configuracaoPortalPadrao
}

export async function carregarContextoPortal(entrada: {
  workspaceId: string
  clienteId?: string | null
  projetoId?: string | null
}) {
  const [[workspace], cliente, projeto] = await Promise.all([
    banco
      .select({
        id: workspaces.id,
        nome: workspaces.nome,
        corPrincipal: workspaces.corPrincipal,
        logoUrl: workspaces.logoUrl,
        portalConfiguracao: workspaces.portalConfiguracao,
      })
      .from(workspaces)
      .where(and(eq(workspaces.id, entrada.workspaceId), isNull(workspaces.excluidoEm)))
      .limit(1),
    entrada.clienteId
      ? banco
          .select({ id: clientes.id, portalConfiguracao: clientes.portalConfiguracao })
          .from(clientes)
          .where(
            and(
              eq(clientes.id, entrada.clienteId),
              eq(clientes.workspaceId, entrada.workspaceId),
              isNull(clientes.excluidoEm),
            ),
          )
          .limit(1)
          .then((linhas) => linhas[0] ?? null)
      : Promise.resolve(null),
    entrada.projetoId
      ? banco
          .select({ id: projetos.id, portalConfiguracao: projetos.portalConfiguracao })
          .from(projetos)
          .where(
            and(
              eq(projetos.id, entrada.projetoId),
              eq(projetos.workspaceId, entrada.workspaceId),
              isNull(projetos.excluidoEm),
            ),
          )
          .limit(1)
          .then((linhas) => linhas[0] ?? null)
      : Promise.resolve(null),
  ])
  if (!workspace) throw new ErroHttp(404, 'Workspace nao encontrado.', 'workspace_nao_encontrado')
  if (entrada.clienteId && !cliente)
    throw new ErroHttp(404, 'Cliente nao encontrado.', 'cliente_nao_encontrado')
  if (entrada.projetoId && !projeto)
    throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')

  const legado: PortalConfiguracaoDados = {
    corPrincipal: workspace.corPrincipal,
    logoClaroUrl: workspace.logoUrl ? `/api/portal/workspaces/${workspace.id}/logo` : null,
    logoEscuroUrl: workspace.logoUrl ? `/api/portal/workspaces/${workspace.id}/logo` : null,
  }
  const workspaceConfig = prepararConfig(workspace.portalConfiguracao, 'workspace', workspace.id)
  const clienteConfig = cliente
    ? prepararConfig(cliente.portalConfiguracao, 'cliente', cliente.id)
    : null
  const projetoConfig = projeto
    ? prepararConfig(projeto.portalConfiguracao, 'projeto', projeto.id)
    : null
  return {
    workspace,
    cliente,
    projeto,
    proprio:
      projeto?.portalConfiguracao ?? cliente?.portalConfiguracao ?? workspace.portalConfiguracao,
    configuracao: mesclarConfiguracoesPortal(legado, workspaceConfig, clienteConfig, projetoConfig),
  }
}

export async function obterAssetPortal(escopo: EscopoPortal, id: string, campo: CampoAssetPortal) {
  if (!camposAssetPortal.includes(campo)) return null
  if (escopo === 'workspace') {
    const [linha] = await banco
      .select({ workspaceId: workspaces.id, config: workspaces.portalConfiguracao })
      .from(workspaces)
      .where(and(eq(workspaces.id, id), isNull(workspaces.excluidoEm)))
      .limit(1)
    return linha ? { workspaceId: linha.workspaceId, caminho: linha.config?.[campo] ?? null } : null
  }
  if (escopo === 'cliente') {
    const [linha] = await banco
      .select({ workspaceId: clientes.workspaceId, config: clientes.portalConfiguracao })
      .from(clientes)
      .where(and(eq(clientes.id, id), isNull(clientes.excluidoEm)))
      .limit(1)
    return linha ? { workspaceId: linha.workspaceId, caminho: linha.config?.[campo] ?? null } : null
  }
  const [linha] = await banco
    .select({ workspaceId: projetos.workspaceId, config: projetos.portalConfiguracao })
    .from(projetos)
    .where(and(eq(projetos.id, id), isNull(projetos.excluidoEm)))
    .limit(1)
  return linha ? { workspaceId: linha.workspaceId, caminho: linha.config?.[campo] ?? null } : null
}
