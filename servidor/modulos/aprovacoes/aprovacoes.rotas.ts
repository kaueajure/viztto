import { Router } from 'express'
import { and, count, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  aprovacoes,
  atividades,
  comentarios,
  materiais,
  notificacoes,
  participantesProjeto,
  projetos,
  versoesMaterial,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { notificarClienteProjetoAlterado } from '../../servicos/notificar-cliente-projeto.servico.js'

const decisao = z.object({
  versaoMaterialId: z.string().uuid(),
  observacao: z.string().trim().max(5000).optional(),
  confirmarPendencias: z.boolean().optional(),
})
const versaoSelecionada = z.object({
  versaoMaterialId: z.string().uuid(),
  observacao: z.string().trim().max(5000).optional(),
})
export const aprovacoesRotas = Router()

async function materialValido(id: string, workspaceId: string) {
  const [m] = await banco
    .select()
    .from(materiais)
    .where(
      and(
        eq(materiais.id, id),
        eq(materiais.workspaceId, workspaceId),
        isNull(materiais.excluidoEm),
      ),
    )
    .limit(1)
  if (!m) throw new ErroHttp(404, 'Material nao encontrado.', 'material_nao_encontrado')
  if (!m.versaoAtualId)
    throw new ErroHttp(422, 'Publique uma versao antes desta acao.', 'versao_ausente')
  return m
}

async function validarVersaoAtual(materialId: string, versaoMaterialId: string, versaoAtualId: string) {
  const [versao] = await banco
    .select({ id: versoesMaterial.id })
    .from(versoesMaterial)
    .where(
      and(
        eq(versoesMaterial.id, versaoMaterialId),
        eq(versoesMaterial.materialId, materialId),
        isNull(versoesMaterial.excluidoEm),
      ),
    )
    .limit(1)
  if (!versao) throw new ErroHttp(404, 'Versao nao encontrada.', 'versao_nao_encontrada')
  if (versao.id !== versaoAtualId)
    throw new ErroHttp(
      409,
      'A decisao so pode ser registrada na versao atual do material.',
      'versao_nao_atual',
    )
  return versao
}

async function carregarContextoAprovacao(projetoId: string, usuarioId: string) {
  const [projeto] = await banco
    .select({
      id: projetos.id,
      modoAprovacao: projetos.modoAprovacao,
      status: projetos.status,
    })
    .from(projetos)
    .where(and(eq(projetos.id, projetoId), isNull(projetos.excluidoEm)))
    .limit(1)
  if (!projeto) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')

  const aprovadores = await banco
    .select({ usuarioId: participantesProjeto.usuarioId })
    .from(participantesProjeto)
    .where(
      and(
        eq(participantesProjeto.projetoId, projetoId),
        eq(participantesProjeto.tipoParticipacao, 'aprovador'),
        isNull(participantesProjeto.removidoEm),
      ),
    )

  if (
    aprovadores.length > 0 &&
    !aprovadores.some((item) => item.usuarioId === usuarioId)
  )
    throw new ErroHttp(
      403,
      'Apenas aprovadores deste projeto podem registrar a aprovacao.',
      'nao_aprovador',
    )

  return { projeto, aprovadores }
}

async function sincronizarStatusProjeto(
  tx: Parameters<Parameters<typeof banco.transaction>[0]>[0],
  projetoId: string,
  agora: Date,
  fallback: 'alteracoes_solicitadas' | 'em_revisao' | 'aguardando_aprovacao' | null = null,
) {
  const lista = await tx
    .select({ status: materiais.status })
    .from(materiais)
    .where(and(eq(materiais.projetoId, projetoId), isNull(materiais.excluidoEm)))

  if (!lista.length) {
    if (fallback)
      await tx
        .update(projetos)
        .set({ status: fallback, atualizadoEm: agora })
        .where(eq(projetos.id, projetoId))
    return
  }

  const todosAprovados = lista.every((item) => item.status === 'aprovado')
  if (todosAprovados) {
    await tx
      .update(projetos)
      .set({ status: 'aprovado', atualizadoEm: agora })
      .where(eq(projetos.id, projetoId))
    return
  }

  if (lista.some((item) => item.status === 'alteracoes_solicitadas')) {
    await tx
      .update(projetos)
      .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
      .where(eq(projetos.id, projetoId))
    return
  }

  if (lista.some((item) => item.status === 'aguardando_aprovacao')) {
    await tx
      .update(projetos)
      .set({ status: 'aguardando_aprovacao', atualizadoEm: agora })
      .where(eq(projetos.id, projetoId))
    return
  }

  if (fallback)
    await tx
      .update(projetos)
      .set({ status: fallback, atualizadoEm: agora })
      .where(eq(projetos.id, projetoId))
}

aprovacoesRotas.post(
  '/materiais/:materialId/aprovar',
  exigirFuncao('atendimento'),
  validarCorpo(decisao),
  async (req, res) => {
    const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
    const versao = await validarVersaoAtual(m.id, req.body.versaoMaterialId, m.versaoAtualId!)
    const { projeto, aprovadores } = await carregarContextoAprovacao(
      m.projetoId,
      req.sessao!.usuarioId,
    )
    const [abertos] = await banco
      .select({ total: count() })
      .from(comentarios)
      .where(
        and(
          eq(comentarios.versaoMaterialId, versao.id),
          eq(comentarios.status, 'aberto'),
          isNull(comentarios.excluidoEm),
        ),
      )
    if ((abertos?.total ?? 0) > 0 && !req.body.confirmarPendencias)
      throw new ErroHttp(
        409,
        'Esta versao possui comentarios pendentes. Confirme para aprovar.',
        'pendencias_abertas',
        { total: abertos?.total },
      )

    const aprovacoesAtuais = await banco
      .select({
        id: aprovacoes.id,
        aprovadoPorUsuarioId: aprovacoes.aprovadoPorUsuarioId,
      })
      .from(aprovacoes)
      .where(
        and(
          eq(aprovacoes.versaoMaterialId, versao.id),
          isNull(aprovacoes.revogadaEm),
        ),
      )
    if (aprovacoesAtuais.some((item) => item.aprovadoPorUsuarioId === req.sessao!.usuarioId))
      throw new ErroHttp(409, 'Voce ja aprovou esta versao.', 'aprovacao_duplicada')

    const agora = new Date()
    const id = novoId()
    const atividadeId = novoId()
    const idsAprovadores = aprovadores.map((item) => item.usuarioId)
    const jaAprovaram = new Set(
      aprovacoesAtuais
        .map((item) => item.aprovadoPorUsuarioId)
        .filter((valor): valor is string => Boolean(valor)),
    )
    jaAprovaram.add(req.sessao!.usuarioId)
    const exigeTodos = projeto.modoAprovacao === 'todos' && idsAprovadores.length > 1
    const materialFinalizado =
      !exigeTodos || idsAprovadores.every((aprovadorId) => jaAprovaram.has(aprovadorId))

    await banco.transaction(async (tx) => {
      await tx.insert(aprovacoes).values({
        id,
        workspaceId: m.workspaceId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        aprovadoPorUsuarioId: req.sessao!.usuarioId,
        observacao: req.body.observacao,
        aprovadoEm: agora,
        criadoEm: agora,
      })
      if (materialFinalizado) {
        await tx
          .update(versoesMaterial)
          .set({ aprovada: true })
          .where(eq(versoesMaterial.id, versao.id))
        await tx
          .update(materiais)
          .set({ status: 'aprovado', atualizadoEm: agora })
          .where(eq(materiais.id, m.id))
      } else {
        await tx
          .update(materiais)
          .set({ status: 'aguardando_aprovacao', atualizadoEm: agora })
          .where(eq(materiais.id, m.id))
      }
      await sincronizarStatusProjeto(tx, m.projetoId, agora, 'aguardando_aprovacao')
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: materialFinalizado ? 'versao_aprovada' : 'aprovacao_parcial',
        descricao: materialFinalizado
          ? 'Versao aprovada e decisao registrada'
          : 'Aprovacao registrada; aguardando demais aprovadores',
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: materialFinalizado ? 'Versao aprovada' : 'Aprovacao registrada',
        descricao: materialFinalizado
          ? 'A decisao foi registrada no historico do material.'
          : 'Sua aprovacao foi registrada. Ainda faltam outros aprovadores.',
        tipo: materialFinalizado ? 'versao_aprovada' : 'aprovacao_parcial',
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: m.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: materialFinalizado
        ? `${req.sessao!.usuarioNome} aprovou uma versao do material "${m.nome}".`
        : `${req.sessao!.usuarioNome} registrou aprovacao no material "${m.nome}".`,
    })
    res.status(201).json({
      dado: {
        id,
        materialFinalizado,
        aprovacoesRegistradas: jaAprovaram.size,
        aprovadoresNecessarios: exigeTodos ? idsAprovadores.length : 1,
      },
    })
  },
)

aprovacoesRotas.post(
  '/materiais/:materialId/solicitar-alteracoes',
  exigirFuncao('atendimento'),
  validarCorpo(versaoSelecionada),
  async (req, res) => {
    const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
    const versao = await validarVersaoAtual(m.id, req.body.versaoMaterialId, m.versaoAtualId!)
    const [abertos] = await banco
      .select({ total: count() })
      .from(comentarios)
      .where(
        and(
          eq(comentarios.versaoMaterialId, versao.id),
          eq(comentarios.status, 'aberto'),
          isNull(comentarios.excluidoEm),
        ),
      )
    if (!(abertos?.total ?? 0) && !req.body.observacao?.trim())
      throw new ErroHttp(
        422,
        'Adicione ao menos um comentario pendente ou uma mensagem geral.',
        'sem_pendencias',
      )
    const agora = new Date()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await sincronizarStatusProjeto(tx, m.projetoId, agora, 'alteracoes_solicitadas')
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: 'alteracoes_solicitadas',
        descricao: req.body.observacao?.trim()
          ? `Alteracoes solicitadas: ${req.body.observacao.trim()}`
          : 'Alteracoes solicitadas nesta versao',
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: 'Alteracoes solicitadas',
        descricao: 'As pendencias da versao foram enviadas para revisao.',
        tipo: 'alteracoes_solicitadas',
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: m.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} solicitou alteracoes no material "${m.nome}".`,
    })
    res.json({ mensagem: 'Alteracoes solicitadas.' })
  },
)

aprovacoesRotas.post(
  '/materiais/:materialId/reabrir',
  exigirFuncao('atendimento'),
  async (req, res) => {
    const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
    const agora = new Date()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'em_revisao', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await tx
        .update(aprovacoes)
        .set({ revogadaEm: agora })
        .where(and(eq(aprovacoes.materialId, m.id), isNull(aprovacoes.revogadaEm)))
      await sincronizarStatusProjeto(tx, m.projetoId, agora, 'em_revisao')
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: m.versaoAtualId!,
        tipo: 'revisao_reaberta',
        descricao: 'Revisao reaberta sem apagar aprovacoes anteriores',
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: 'Revisao reaberta',
        descricao: 'O material voltou ao fluxo de revisao.',
        tipo: 'revisao_reaberta',
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: m.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} reabriu a revisao do material "${m.nome}".`,
    })
    res.json({ mensagem: 'Revisao reaberta.' })
  },
)

/** Lista aprovacoes da versao atual (quem aprovou / quem falta). */
aprovacoesRotas.get('/materiais/:materialId/aprovadores', async (req, res) => {
  const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
  const [projeto] = await banco
    .select({ modoAprovacao: projetos.modoAprovacao })
    .from(projetos)
    .where(eq(projetos.id, m.projetoId))
    .limit(1)
  const aprovadores = await banco
    .select({
      usuarioId: participantesProjeto.usuarioId,
    })
    .from(participantesProjeto)
    .where(
      and(
        eq(participantesProjeto.projetoId, m.projetoId),
        eq(participantesProjeto.tipoParticipacao, 'aprovador'),
        isNull(participantesProjeto.removidoEm),
      ),
    )
  const registros = m.versaoAtualId
    ? await banco
        .select({
          id: aprovacoes.id,
          usuarioId: aprovacoes.aprovadoPorUsuarioId,
          aprovadoEm: aprovacoes.aprovadoEm,
          externoNome: aprovacoes.aprovadoPorExternoNome,
        })
        .from(aprovacoes)
        .where(
          and(
            eq(aprovacoes.versaoMaterialId, m.versaoAtualId),
            isNull(aprovacoes.revogadaEm),
          ),
        )
    : []
  const aprovadosIds = new Set(
    registros.map((item) => item.usuarioId).filter((valor): valor is string => Boolean(valor)),
  )
  res.json({
    dado: {
      modoAprovacao: projeto?.modoAprovacao ?? 'qualquer',
      versaoMaterialId: m.versaoAtualId,
      aprovadores: aprovadores.map((item) => ({
        usuarioId: item.usuarioId,
        status: aprovadosIds.has(item.usuarioId) ? 'aprovado' : 'aguardando',
      })),
      registros,
    },
  })
})
