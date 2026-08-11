import { Router } from 'express'
import { and, count, desc, eq, inArray, isNull, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  atividades,
  clientes,
  materiais,
  membrosWorkspace,
  participantesProjeto,
  projetos,
  usuarios,
  workspaces,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { consultaPaginada, paginar } from '../../utilitarios/paginacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import {
  notificarClienteProjetoAlterado,
  notificarClienteProjetoCriado,
  reenviarLinkPortalProjeto,
} from '../../servicos/notificar-cliente-projeto.servico.js'
import {
  garantirPodeCriarProjeto,
  garantirLinksPortalCliente,
  carregarPlanoDoWorkspace,
} from '../../servicos/limites-plano.servico.js'
import {
  gerarTokenPortal,
  linkPortalProjeto,
} from '../../servicos/projeto-acesso.servico.js'
import { recalcularStatusProjeto } from '../../servicos/projeto-status.servico.js'
import { listarContatosDoCliente } from '../../servicos/contatos-cliente.servico.js'

function semSegredosPortal<T extends { senhaAcessoHash?: string | null }>(projeto: T) {
  const { senhaAcessoHash: _omitido, ...resto } = projeto
  void _omitido
  return resto
}

const idsParticipantes = z.array(z.string().uuid()).max(50).default([])

const dadosProjeto = z.object({
  clienteId: z.string().uuid(),
  nome: z.string().trim().min(2).max(200),
  descricao: z.string().max(5000).optional().nullable(),
  tipo: z.string().trim().min(2).max(80),
  dataInicio: z.coerce.date().optional().nullable(),
  prazoEm: z.coerce.date().optional().nullable(),
  modoAprovacao: z.enum(['qualquer', 'todos']).optional(),
  portalAtivo: z.boolean().optional(),
  responsavelIds: idsParticipantes,
  aprovadorIds: idsParticipantes,
})

const dadosProjetoAtualizacao = dadosProjeto
  .omit({ responsavelIds: true, aprovadorIds: true })
  .partial()
  .extend({
    /** Status operacional é derivado dos materiais; só arquivar é manual. */
    status: z.enum(['arquivado']).optional(),
  })

const dadosParticipantes = z.object({
  responsavelIds: idsParticipantes,
  aprovadorIds: idsParticipantes,
  permissoes: z
    .array(
      z.object({
        usuarioId: z.string().uuid(),
        podeEnviarMateriais: z.boolean().optional(),
        podeResponderComentarios: z.boolean().optional(),
      }),
    )
    .max(50)
    .optional(),
})

type ParticipanteResposta = {
  usuarioId: string
  nome: string
  email: string
  avatarUrl: string | null
  tipoParticipacao: 'responsavel' | 'colaborador' | 'aprovador' | 'visualizador'
  podeEnviarMateriais: boolean
  podeResponderComentarios: boolean
}

async function carregarParticipantes(projetoIds: string[]): Promise<Map<string, ParticipanteResposta[]>> {
  const mapa = new Map<string, ParticipanteResposta[]>()
  if (!projetoIds.length) return mapa
  const linhas = await banco
    .select({
      projetoId: participantesProjeto.projetoId,
      usuarioId: participantesProjeto.usuarioId,
      tipoParticipacao: participantesProjeto.tipoParticipacao,
      podeEnviarMateriais: participantesProjeto.podeEnviarMateriais,
      podeResponderComentarios: participantesProjeto.podeResponderComentarios,
      nome: usuarios.nome,
      email: usuarios.email,
      avatarUrl: usuarios.avatarUrl,
    })
    .from(participantesProjeto)
    .innerJoin(usuarios, eq(usuarios.id, participantesProjeto.usuarioId))
    .where(
      and(
        inArray(participantesProjeto.projetoId, projetoIds),
        isNull(participantesProjeto.removidoEm),
      ),
    )
  for (const linha of linhas) {
    const lista = mapa.get(linha.projetoId) ?? []
    lista.push({
      usuarioId: linha.usuarioId,
      nome: linha.nome,
      email: linha.email,
      avatarUrl: linha.avatarUrl,
      tipoParticipacao: linha.tipoParticipacao,
      podeEnviarMateriais: linha.podeEnviarMateriais,
      podeResponderComentarios: linha.podeResponderComentarios,
    })
    mapa.set(linha.projetoId, lista)
  }
  return mapa
}

async function validarMembrosDoWorkspace(workspaceId: string, usuarioIds: string[]) {
  if (!usuarioIds.length) return
  const unicos = [...new Set(usuarioIds)]
  const membros = await banco
    .select({ usuarioId: membrosWorkspace.usuarioId })
    .from(membrosWorkspace)
    .where(
      and(
        eq(membrosWorkspace.workspaceId, workspaceId),
        eq(membrosWorkspace.status, 'ativo'),
        inArray(membrosWorkspace.usuarioId, unicos),
      ),
    )
  if (membros.length !== unicos.length)
    throw new ErroHttp(
      422,
      'Um ou mais participantes nao pertencem a este workspace.',
      'participante_invalido',
    )
}

async function validarListasParticipantes(
  workspaceId: string,
  responsavelIds: string[],
  aprovadorIds: string[],
  permiteVariosAprovadores: boolean,
) {
  if (!permiteVariosAprovadores && aprovadorIds.length > 1)
    throw new ErroHttp(
      422,
      'Seu plano permite apenas um aprovador por projeto.',
      'limite_aprovadores',
    )
  if (responsavelIds.some((id) => aprovadorIds.includes(id)))
    throw new ErroHttp(
      422,
      'O mesmo usuario nao pode ser responsavel e aprovador no mesmo projeto.',
      'participante_duplicado',
    )
  await validarMembrosDoWorkspace(workspaceId, [...responsavelIds, ...aprovadorIds])
}

async function sincronizarParticipantes(
  tx: Parameters<Parameters<typeof banco.transaction>[0]>[0],
  projetoId: string,
  responsavelIds: string[],
  aprovadorIds: string[],
  agora: Date,
  permissoes?: Array<{
    usuarioId: string
    podeEnviarMateriais?: boolean
    podeResponderComentarios?: boolean
  }>,
) {
  const desejados = new Map<string, 'responsavel' | 'aprovador'>()
  for (const id of responsavelIds) desejados.set(id, 'responsavel')
  for (const id of aprovadorIds) desejados.set(id, 'aprovador')
  const mapaPermissoes = new Map(
    (permissoes ?? []).map((item) => [item.usuarioId, item] as const),
  )

  const existentes = await tx
    .select()
    .from(participantesProjeto)
    .where(eq(participantesProjeto.projetoId, projetoId))

  for (const atual of existentes) {
    const tipo = desejados.get(atual.usuarioId)
    if (!tipo) {
      if (!atual.removidoEm)
        await tx
          .update(participantesProjeto)
          .set({ removidoEm: agora })
          .where(eq(participantesProjeto.id, atual.id))
      continue
    }
    desejados.delete(atual.usuarioId)
    const perms = mapaPermissoes.get(atual.usuarioId)
    await tx
      .update(participantesProjeto)
      .set({
        tipoParticipacao: tipo,
        removidoEm: null,
        ...(perms?.podeEnviarMateriais !== undefined
          ? { podeEnviarMateriais: perms.podeEnviarMateriais }
          : {}),
        ...(perms?.podeResponderComentarios !== undefined
          ? { podeResponderComentarios: perms.podeResponderComentarios }
          : {}),
      })
      .where(eq(participantesProjeto.id, atual.id))
  }

  const novos = [...desejados.entries()].map(([usuarioId, tipoParticipacao]) => {
    const perms = mapaPermissoes.get(usuarioId)
    return {
      id: novoId(),
      projetoId,
      usuarioId,
      tipoParticipacao,
      podeEnviarMateriais: perms?.podeEnviarMateriais ?? true,
      podeResponderComentarios: perms?.podeResponderComentarios ?? true,
      criadoEm: agora,
    }
  })
  if (novos.length) await tx.insert(participantesProjeto).values(novos)
}

export const projetosRotas = Router()

projetosRotas.get('/', async (req, res) => {
  const q = consultaPaginada.parse(req.query)
  const workspaceId = req.sessao!.workspaceId
  const filtro = and(
    eq(projetos.workspaceId, workspaceId),
    isNull(projetos.excluidoEm),
    q.busca ? like(projetos.nome, `%${q.busca}%`) : undefined,
  )
  const [[c], dados] = await Promise.all([
    banco.select({ total: count() }).from(projetos).where(filtro),
    banco
      .select()
      .from(projetos)
      .where(filtro)
      .orderBy(desc(projetos.atualizadoEm))
      .limit(q.porPagina)
      .offset((q.pagina - 1) * q.porPagina),
  ])
  const participantesPorProjeto = await carregarParticipantes(dados.map((item) => item.id))
  const progressoPorProjeto = new Map<
    string,
    { totalMaterials: number; approvedMaterials: number; progress: number }
  >()
  if (dados.length) {
    const totais = await banco
      .select({
        projetoId: materiais.projetoId,
        total: count(),
        aprovados: sql<number>`sum(case when ${materiais.status} = 'aprovado' then 1 else 0 end)`,
      })
      .from(materiais)
      .where(
        and(
          inArray(
            materiais.projetoId,
            dados.map((item) => item.id),
          ),
          isNull(materiais.excluidoEm),
        ),
      )
      .groupBy(materiais.projetoId)
    for (const linha of totais) {
      const total = Number(linha.total ?? 0)
      const approved = Number(linha.aprovados ?? 0)
      progressoPorProjeto.set(linha.projetoId, {
        totalMaterials: total,
        approvedMaterials: approved,
        progress: total > 0 ? Math.round((approved / total) * 100) : 0,
      })
    }
  }
  res.json(
    paginar(
      q.pagina,
      q.porPagina,
      c?.total ?? 0,
      dados.map((projeto) => ({
        ...semSegredosPortal(projeto),
        participantes: participantesPorProjeto.get(projeto.id) ?? [],
        ...(progressoPorProjeto.get(projeto.id) ?? {
          totalMaterials: 0,
          approvedMaterials: 0,
          progress: 0,
        }),
      })),
    ),
  )
})

projetosRotas.post(
  '/',
  exigirFuncao('atendimento'),
  validarCorpo(dadosProjeto),
  async (req, res) => {
    const { responsavelIds, aprovadorIds, ...dados } = req.body as z.infer<typeof dadosProjeto>
    const [cliente] = await banco
      .select({ id: clientes.id })
      .from(clientes)
      .where(
        and(
          eq(clientes.id, dados.clienteId),
          eq(clientes.workspaceId, req.sessao!.workspaceId),
          isNull(clientes.excluidoEm),
        ),
      )
      .limit(1)
    if (!cliente)
      throw new ErroHttp(422, 'Cliente inválido para este workspace.', 'cliente_invalido')
    await garantirPodeCriarProjeto(req.sessao!.workspaceId)
    const { plano } = await carregarPlanoDoWorkspace(req.sessao!.workspaceId)
    await validarListasParticipantes(
      req.sessao!.workspaceId,
      responsavelIds,
      aprovadorIds,
      plano.permiteVariosAprovadores,
    )
    const agora = new Date()
    const id = novoId()
    const portalLiberado = plano.permiteLinksPortalCliente
    const tokenPortal = portalLiberado ? gerarTokenPortal() : null
    await banco.transaction(async (tx) => {
      await tx.insert(projetos).values({
        id,
        workspaceId: req.sessao!.workspaceId,
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        atualizadoEm: agora,
        ...dados,
        tokenPortal,
      })
      await sincronizarParticipantes(tx, id, responsavelIds, aprovadorIds, agora)
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: req.sessao!.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: id,
        tipo: 'projeto_criado',
        descricao: `Projeto ${dados.nome} criado`,
        criadoEm: agora,
      })
    })
    if (tokenPortal)
      await notificarClienteProjetoCriado({
        projetoId: id,
        workspaceId: req.sessao!.workspaceId,
        criadorNome: req.sessao!.usuarioNome,
      })
    res.status(201).json({ dado: { id } })
  },
)

projetosRotas.get('/:projetoId', async (req, res) => {
  const [dado] = await banco
    .select()
    .from(projetos)
    .where(
      and(
        eq(projetos.id, String(req.params.projetoId)),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
    .limit(1)
  if (!dado) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  const participantes = (await carregarParticipantes([dado.id])).get(dado.id) ?? []
  res.json({ dado: { ...semSegredosPortal(dado), participantes } })
})

projetosRotas.put(
  '/:projetoId/participantes',
  exigirFuncao('atendimento'),
  validarCorpo(dadosParticipantes),
  async (req, res) => {
    const projetoId = String(req.params.projetoId)
    const [projeto] = await banco
      .select({ id: projetos.id })
      .from(projetos)
      .where(
        and(
          eq(projetos.id, projetoId),
          eq(projetos.workspaceId, req.sessao!.workspaceId),
          isNull(projetos.excluidoEm),
        ),
      )
      .limit(1)
    if (!projeto) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
    const { responsavelIds, aprovadorIds } = req.body as z.infer<typeof dadosParticipantes>
    const { plano } = await carregarPlanoDoWorkspace(req.sessao!.workspaceId)
    await validarListasParticipantes(
      req.sessao!.workspaceId,
      responsavelIds,
      aprovadorIds,
      plano.permiteVariosAprovadores,
    )
    const agora = new Date()
    await banco.transaction(async (tx) => {
      await sincronizarParticipantes(
        tx,
        projetoId,
        responsavelIds,
        aprovadorIds,
        agora,
        (req.body as z.infer<typeof dadosParticipantes>).permissoes,
      )
      await tx
        .update(projetos)
        .set({ atualizadoEm: agora })
        .where(eq(projetos.id, projetoId))
    })
    const participantes = (await carregarParticipantes([projetoId])).get(projetoId) ?? []
    res.json({ mensagem: 'Participantes atualizados.', dado: { participantes } })
  },
)

/** Retorna (e cria se preciso) o link do portal com token. */
projetosRotas.get('/:projetoId/link-portal', exigirFuncao('atendimento'), async (req, res) => {
  await garantirLinksPortalCliente(req.sessao!.workspaceId)
  const projetoId = String(req.params.projetoId)
  const [projeto] = await banco
    .select({
      id: projetos.id,
      tokenPortal: projetos.tokenPortal,
      slug: workspaces.slug,
    })
    .from(projetos)
    .innerJoin(workspaces, eq(workspaces.id, projetos.workspaceId))
    .where(
      and(
        eq(projetos.id, projetoId),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
    .limit(1)
  if (!projeto) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  let token = projeto.tokenPortal
  if (!token) {
    token = gerarTokenPortal()
    await banco
      .update(projetos)
      .set({
        tokenPortal: token,
        portalCriadoEm: new Date(),
        atualizadoEm: new Date(),
      })
      .where(eq(projetos.id, projetoId))
  }
  res.json({
    dado: {
      tokenPortal: token,
      link: linkPortalProjeto(projetoId, projeto.slug, token),
    },
  })
})

/** Regenera o token (invalida links antigos) e reenvia por e-mail. */
projetosRotas.post('/:projetoId/link-portal', exigirFuncao('atendimento'), async (req, res) => {
  await garantirLinksPortalCliente(req.sessao!.workspaceId)
  const projetoId = String(req.params.projetoId)
  const [projeto] = await banco
    .select({ id: projetos.id })
    .from(projetos)
    .where(
      and(
        eq(projetos.id, projetoId),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
    .limit(1)
  if (!projeto) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  const tokenPortal = gerarTokenPortal()
  await banco
    .update(projetos)
    .set({
      tokenPortal,
      portalCriadoEm: new Date(),
      portalAcessos: 0,
      portalUltimoAcessoEm: null,
      atualizadoEm: new Date(),
    })
    .where(eq(projetos.id, projetoId))
  const envio = await reenviarLinkPortalProjeto({
    projetoId,
    workspaceId: req.sessao!.workspaceId,
    criadorNome: req.sessao!.usuarioNome,
  })
  if (!envio.enviado) {
    if (envio.motivo === 'cliente_sem_email')
      throw new ErroHttp(
        422,
        'Cadastre o e-mail do cliente antes de reenviar o link.',
        'cliente_sem_email',
      )
    if (envio.motivo === 'token_ausente')
      throw new ErroHttp(500, 'Token do portal não foi gerado.', 'token_ausente')
    throw new ErroHttp(
      503,
      'Não foi possível enviar o link. Tente novamente.',
      'email_falhou',
    )
  }
  const [ws] = await banco
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, req.sessao!.workspaceId))
    .limit(1)
  res.json({
    mensagem: 'Novo link enviado. Links anteriores expiraram.',
    dado: {
      tokenPortal,
      link: ws ? linkPortalProjeto(projetoId, ws.slug, tokenPortal) : null,
    },
  })
})

projetosRotas.patch(
  '/:projetoId',
  exigirFuncao('atendimento'),
  validarCorpo(dadosProjetoAtualizacao),
  async (req, res) => {
    const r = await banco
      .update(projetos)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(
        and(
          eq(projetos.id, String(req.params.projetoId)),
          eq(projetos.workspaceId, req.sessao!.workspaceId),
          isNull(projetos.excluidoEm),
        ),
      )
    if (!r[0].affectedRows)
      throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
    await notificarClienteProjetoAlterado({
      projetoId: String(req.params.projetoId),
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} atualizou os dados do projeto.`,
    })
    res.json({ mensagem: 'Projeto atualizado.' })
  },
)

/** Revoga o link atual do portal (invalida tokens existentes). */
projetosRotas.delete('/:projetoId/link-portal', exigirFuncao('atendimento'), async (req, res) => {
  const projetoId = String(req.params.projetoId)
  const r = await banco
    .update(projetos)
    .set({
      tokenPortal: null,
      portalAcessos: 0,
      portalUltimoAcessoEm: null,
      portalCriadoEm: null,
      atualizadoEm: new Date(),
    })
    .where(
      and(
        eq(projetos.id, projetoId),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
  if (!r[0].affectedRows)
    throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  res.json({ mensagem: 'Link do portal revogado.' })
})

/** Restaura projeto arquivado e recalcula status a partir dos materiais. */
projetosRotas.post('/:projetoId/restaurar', exigirFuncao('atendimento'), async (req, res) => {
  const projetoId = String(req.params.projetoId)
  const agora = new Date()
  const r = await banco
    .update(projetos)
    .set({ status: 'em_andamento', atualizadoEm: agora })
    .where(
      and(
        eq(projetos.id, projetoId),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        eq(projetos.status, 'arquivado'),
        isNull(projetos.excluidoEm),
      ),
    )
  if (!r[0].affectedRows)
    throw new ErroHttp(404, 'Projeto arquivado não encontrado.', 'projeto_nao_encontrado')
  const status = await recalcularStatusProjeto(projetoId, agora)
  res.json({ mensagem: 'Projeto restaurado.', dado: { status } })
})

projetosRotas.get('/:projetoId/contatos-cliente', async (req, res) => {
  const [projeto] = await banco
    .select({ clienteId: projetos.clienteId })
    .from(projetos)
    .where(
      and(
        eq(projetos.id, String(req.params.projetoId)),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
    .limit(1)
  if (!projeto) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  const lista = await listarContatosDoCliente(projeto.clienteId, req.sessao!.workspaceId)
  res.json({ dados: lista })
})

projetosRotas.delete('/:projetoId', exigirFuncao('gestor'), async (req, res) => {
  const r = await banco
    .update(projetos)
    .set({ excluidoEm: new Date(), atualizadoEm: new Date() })
    .where(
      and(
        eq(projetos.id, String(req.params.projetoId)),
        eq(projetos.workspaceId, req.sessao!.workspaceId),
        isNull(projetos.excluidoEm),
      ),
    )
  if (!r[0].affectedRows)
    throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  res.status(204).end()
})
