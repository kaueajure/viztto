import { and, count, eq, gt, isNull, ne, sum } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import {
  arquivos,
  clientes,
  convitesWorkspace,
  membrosWorkspace,
  planosAssinatura,
  projetos,
  workspaces,
} from '../banco/esquema/index.js'
import { ErroHttp } from '../middlewares/erros.js'
import {
  carregarContextoPortal,
  configuracaoPortalPadrao,
} from './portal-personalizacao.servico.js'

export type PlanoAssinaturaLinha = typeof planosAssinatura.$inferSelect
export type CodigoPlano = PlanoAssinaturaLinha['codigo']

const COR_PADRAO = '#b8ff4f'

export async function carregarPlanoPorCodigo(codigo: CodigoPlano) {
  const [plano] = await banco
    .select()
    .from(planosAssinatura)
    .where(eq(planosAssinatura.codigo, codigo))
    .limit(1)
  return plano ?? null
}

export async function carregarPlanoDoWorkspace(workspaceId: string) {
  const [workspace] = await banco
    .select({ plano: workspaces.plano })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
  if (!workspace) throw new ErroHttp(404, 'Workspace nao encontrado.', 'workspace_nao_encontrado')
  const plano = await carregarPlanoPorCodigo(workspace.plano)
  if (!plano) throw new ErroHttp(404, 'Plano nao encontrado.', 'plano_nao_encontrado')
  return { workspace, plano }
}

function exigirDentroDoLimite(
  limite: number | null,
  usoAtual: number,
  mensagem: string,
  codigo: string,
) {
  if (limite == null) return
  if (usoAtual >= limite) throw new ErroHttp(403, mensagem, codigo)
}

export async function contarProjetosAtivos(workspaceId: string) {
  const [[linha]] = await Promise.all([
    banco
      .select({ total: count() })
      .from(projetos)
      .where(
        and(
          eq(projetos.workspaceId, workspaceId),
          isNull(projetos.excluidoEm),
          ne(projetos.status, 'arquivado'),
        ),
      ),
  ])
  return linha?.total ?? 0
}

export async function contarMembrosEConvites(workspaceId: string) {
  const agora = new Date()
  const [[membros], [convites]] = await Promise.all([
    banco
      .select({ total: count() })
      .from(membrosWorkspace)
      .where(
        and(eq(membrosWorkspace.workspaceId, workspaceId), eq(membrosWorkspace.status, 'ativo')),
      ),
    banco
      .select({ total: count() })
      .from(convitesWorkspace)
      .where(
        and(
          eq(convitesWorkspace.workspaceId, workspaceId),
          isNull(convitesWorkspace.aceitoEm),
          isNull(convitesWorkspace.canceladoEm),
          gt(convitesWorkspace.expiraEm, agora),
        ),
      ),
  ])
  return (membros?.total ?? 0) + (convites?.total ?? 0)
}

export async function contarClientes(workspaceId: string) {
  const [linha] = await banco
    .select({ total: count() })
    .from(clientes)
    .where(and(eq(clientes.workspaceId, workspaceId), isNull(clientes.excluidoEm)))
  return linha?.total ?? 0
}

export async function somarArmazenamentoBytes(workspaceId: string) {
  const [linha] = await banco
    .select({ total: sum(arquivos.tamanhoBytes) })
    .from(arquivos)
    .where(eq(arquivos.workspaceId, workspaceId))
  return Number(linha?.total ?? 0)
}

export async function contarWorkspacesDoUsuario(usuarioId: string) {
  const [linha] = await banco
    .select({ total: count() })
    .from(membrosWorkspace)
    .innerJoin(workspaces, eq(workspaces.id, membrosWorkspace.workspaceId))
    .where(
      and(
        eq(membrosWorkspace.usuarioId, usuarioId),
        eq(membrosWorkspace.status, 'ativo'),
        eq(workspaces.ativo, true),
        isNull(workspaces.excluidoEm),
      ),
    )
  return linha?.total ?? 0
}

export async function maxWorkspacesPermitidosParaUsuario(usuarioId: string) {
  const planos = await banco
    .select({
      maxWorkspaces: planosAssinatura.maxWorkspaces,
    })
    .from(membrosWorkspace)
    .innerJoin(workspaces, eq(workspaces.id, membrosWorkspace.workspaceId))
    .innerJoin(planosAssinatura, eq(planosAssinatura.codigo, workspaces.plano))
    .where(
      and(
        eq(membrosWorkspace.usuarioId, usuarioId),
        eq(membrosWorkspace.status, 'ativo'),
        eq(workspaces.ativo, true),
        isNull(workspaces.excluidoEm),
      ),
    )
  if (!planos.length) {
    const gratuito = await carregarPlanoPorCodigo('gratuito')
    return gratuito?.maxWorkspaces ?? 1
  }
  if (planos.some((p) => p.maxWorkspaces == null)) return null
  return Math.max(...planos.map((p) => p.maxWorkspaces ?? 0))
}

export async function garantirPodeCriarProjeto(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  const uso = await contarProjetosAtivos(workspaceId)
  exigirDentroDoLimite(
    plano.maxProjetosAtivos,
    uso,
    `Limite de projetos ativos do plano ${plano.nome} atingido.`,
    'limite_projetos',
  )
}

export async function garantirPodeConvidarMembro(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  const uso = await contarMembrosEConvites(workspaceId)
  exigirDentroDoLimite(
    plano.maxMembros,
    uso,
    `Limite de membros do plano ${plano.nome} atingido.`,
    'limite_membros',
  )
}

export async function garantirPodeCriarCliente(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  const uso = await contarClientes(workspaceId)
  exigirDentroDoLimite(
    plano.maxClientes,
    uso,
    `Limite de clientes do plano ${plano.nome} atingido.`,
    'limite_clientes',
  )
}

export async function garantirPodeUsarArmazenamento(workspaceId: string, bytesNovos: number) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (plano.maxArmazenamentoGb == null) return
  const usado = await somarArmazenamentoBytes(workspaceId)
  const limiteBytes = plano.maxArmazenamentoGb * 1024 * 1024 * 1024
  if (usado + bytesNovos > limiteBytes)
    throw new ErroHttp(
      403,
      `Limite de armazenamento do plano ${plano.nome} atingido.`,
      'limite_armazenamento',
    )
}

export async function garantirPodeCriarWorkspace(usuarioId: string) {
  const atuais = await contarWorkspacesDoUsuario(usuarioId)
  if (atuais === 0) return
  const max = await maxWorkspacesPermitidosParaUsuario(usuarioId)
  exigirDentroDoLimite(
    max,
    atuais,
    'Limite de workspaces do seu plano atingido. Faça upgrade para criar outro espaço.',
    'limite_workspaces',
  )
}

export async function garantirIdentidadePersonalizada(
  workspaceId: string,
  corPrincipal: string,
  logoUrl?: string | null,
) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (plano.permiteIdentidadePersonalizada) return
  const corMudou = corPrincipal.toLowerCase() !== COR_PADRAO
  const logoMudou = Boolean(logoUrl)
  if (corMudou || logoMudou)
    throw new ErroHttp(
      403,
      'Personalizar a marca da empresa nao esta disponivel no seu plano.',
      'recurso_identidade',
    )
}

export async function garantirLinksPortalCliente(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (!plano.permiteLinksPortalCliente)
    throw new ErroHttp(
      403,
      'Links de portal para o cliente nao estao disponiveis no seu plano.',
      'recurso_portal',
    )
}

export async function garantirTipoMaterial(workspaceId: string, tipo: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (tipo === 'imagem' && !plano.permiteComentariosImagem)
    throw new ErroHttp(
      403,
      'Materiais de imagem nao estao disponiveis no seu plano.',
      'recurso_imagem',
    )
  if (tipo === 'video' && !plano.permiteComentariosVideo)
    throw new ErroHttp(
      403,
      'Materiais de video nao estao disponiveis no seu plano.',
      'recurso_video',
    )
  if (tipo === 'pdf' && !plano.permiteComentariosPdf)
    throw new ErroHttp(403, 'Materiais PDF nao estao disponiveis no seu plano.', 'recurso_pdf')
}

export async function garantirComentarioNoMaterial(workspaceId: string, tipoMaterial: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (tipoMaterial === 'imagem' && !plano.permiteComentariosImagem)
    throw new ErroHttp(
      403,
      'Comentarios em imagens nao estao disponiveis no seu plano.',
      'recurso_comentario_imagem',
    )
  if (tipoMaterial === 'video' && !plano.permiteComentariosVideo)
    throw new ErroHttp(
      403,
      'Comentarios em video nao estao disponiveis no seu plano.',
      'recurso_comentario_video',
    )
  if (tipoMaterial === 'pdf' && !plano.permiteComentariosPdf)
    throw new ErroHttp(
      403,
      'Comentarios em PDF nao estao disponiveis no seu plano.',
      'recurso_comentario_pdf',
    )
}

export async function garantirFuncaoEquipe(
  workspaceId: string,
  funcao: 'administrador' | 'gestor' | 'criativo' | 'atendimento' | 'visualizador',
) {
  if (funcao === 'administrador' || funcao === 'visualizador') return
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (!plano.permiteFuncoesAvancadas)
    throw new ErroHttp(
      403,
      'Funcoes avancadas de equipe (gestor, criativo, atendimento) nao estao disponiveis no seu plano.',
      'recurso_funcoes',
    )
}

function recursosDoPlano(plano: PlanoAssinaturaLinha) {
  return {
    permiteIdentidadePersonalizada: plano.permiteIdentidadePersonalizada,
    permiteCalendarioEditorial: plano.permiteCalendarioEditorial,
    permiteRelatorios: plano.permiteRelatorios,
    permiteComentariosImagem: plano.permiteComentariosImagem,
    permiteComentariosVideo: plano.permiteComentariosVideo,
    permiteComentariosPdf: plano.permiteComentariosPdf,
    permiteLinksPortalCliente: plano.permiteLinksPortalCliente,
    permiteVariosAprovadores: plano.permiteVariosAprovadores,
    permiteHistoricoAvancado: plano.permiteHistoricoAvancado,
    permitePrioridadeSuporte: plano.permitePrioridadeSuporte,
    permiteFuncoesAvancadas: plano.permiteFuncoesAvancadas,
  }
}

export async function obterUsoELimitesDoWorkspace(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  const [projetosAtivos, membros, clientesAtivos, armazenamentoBytes, workspace] =
    await Promise.all([
      contarProjetosAtivos(workspaceId),
      contarMembrosEConvites(workspaceId),
      contarClientes(workspaceId),
      somarArmazenamentoBytes(workspaceId),
      banco
        .select({
          plano: workspaces.plano,
          corPrincipal: workspaces.corPrincipal,
          logoUrl: workspaces.logoUrl,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1)
        .then((rows) => rows[0]),
    ])
  return {
    codigo: plano.codigo,
    nome: plano.nome,
    beneficios: Array.isArray(plano.beneficios) ? plano.beneficios : [],
    limites: {
      maxProjetosAtivos: plano.maxProjetosAtivos,
      maxMembros: plano.maxMembros,
      maxClientes: plano.maxClientes,
      maxArmazenamentoGb: plano.maxArmazenamentoGb,
      maxWorkspaces: plano.maxWorkspaces,
    },
    uso: {
      projetosAtivos,
      membros,
      clientes: clientesAtivos,
      armazenamentoBytes,
      armazenamentoGb: Number((armazenamentoBytes / (1024 * 1024 * 1024)).toFixed(2)),
    },
    recursos: recursosDoPlano(plano),
    workspace: workspace ?? null,
  }
}

export async function garantirPortalPersonalizado(workspaceId: string) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  if (!plano.permiteIdentidadePersonalizada)
    throw new ErroHttp(
      403,
      'A personalizacao completa do portal nao esta disponivel no plano atual.',
      'recurso_indisponivel_no_plano',
    )
  return plano
}

export async function carregarMarcaPortal(
  workspaceId: string,
  clienteId?: string | null,
  projetoId?: string | null,
) {
  const { plano } = await carregarPlanoDoWorkspace(workspaceId)
  const portalPersonalizado = plano.permiteIdentidadePersonalizada
  const contexto = await carregarContextoPortal({ workspaceId, clienteId, projetoId })
  const configuracao = portalPersonalizado ? contexto.configuracao : { ...configuracaoPortalPadrao }
  return {
    empresaNome: contexto.workspace.nome ?? 'Empresa',
    ...configuracao,
    logoUrl: configuracao.logoClaroUrl,
    whiteLabel: portalPersonalizado,
    portalLiberado: plano.permiteLinksPortalCliente,
  }
}
