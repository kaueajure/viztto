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

const cor = z.string().regex(/^#[0-9a-f]{6}$/i)
export const configuracaoPortalEntrada = z
  .object({
    corPrincipal: cor.optional(),
    corSecundaria: cor.optional(),
    tema: z.enum(['escuro', 'claro']).optional(),
    fonte: z.enum(['instrument', 'serif', 'sistema']).optional(),
    estilo: z.enum(['suave', 'quadrado', 'pill']).optional(),
    fundoTipo: z.enum(['cor', 'gradiente', 'imagem']).optional(),
    fundoCor: cor.optional(),
    fundoGradiente: z.enum(['aurora', 'oceano', 'por-do-sol', 'monocromatico']).optional(),
    marcaDaguaOpacidade: z.number().min(0.04).max(0.5).optional(),
    nomePortal: z.string().trim().min(2).max(80).optional(),
    mensagemAprovacao: z.string().trim().max(500).optional(),
    mensagemAlteracoes: z.string().trim().max(500).optional(),
    rodapeTexto: z.string().trim().max(300).optional(),
    suporteEmail: z.union([z.string().email(), z.literal('')]).optional(),
    suporteTelefone: z.string().trim().max(40).optional(),
    suporteWhatsapp: z.string().trim().max(30).optional(),
    mostrarPrazo: z.boolean().optional(),
    mostrarStatus: z.boolean().optional(),
    mostrarCliente: z.boolean().optional(),
    mostrarTipo: z.boolean().optional(),
    mostrarVersao: z.boolean().optional(),
    materiaisAprovados: z.enum(['mostrar', 'separar', 'ocultar']).optional(),
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
