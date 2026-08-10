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
import { garantirPodeAprovarProjeto } from '../../servicos/projeto-aprovacao.servico.js'
import { recalcularStatusProjeto } from '../../servicos/projeto-status.servico.js'
import {
  acaoEnvioAprovacaoAtividade,
  descricaoEnvioAprovacaoNotificacao,
} from '../../utilitarios/descricao-comentario.js'

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

/**
 * Envia a versão para revisão/aprovação do Cliente 2.
 * Nunca define o material como `aprovado` — isso é exclusivo do portal.
 */
aprovacoesRotas.post(
  '/materiais/:materialId/aprovar',
  exigirFuncao('atendimento'),
  validarCorpo(decisao),
  async (req, res) => {
    const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
    if (m.status === 'aprovado')
      throw new ErroHttp(
        409,
        'Este material ja foi aprovado pelo cliente. Reabra a revisao para enviar novamente.',
        'material_ja_aprovado',
      )
    const versao = await validarVersaoAtual(m.id, req.body.versaoMaterialId, m.versaoAtualId!)
    const { aprovadores } = await garantirPodeAprovarProjeto(m.projetoId, {
      usuarioId: req.sessao!.usuarioId,
      funcao: req.sessao!.funcao,
      admin: req.sessao!.admin,
    })
    const [projeto] = await banco
      .select({ modoAprovacao: projetos.modoAprovacao })
      .from(projetos)
      .where(eq(projetos.id, m.projetoId))
      .limit(1)

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
        'Esta versao possui comentarios pendentes. Confirme para enviar.',
        'pendencias_abertas',
        { total: abertos?.total },
      )

    const aprovacoesAtuais = await banco
      .select({
        id: aprovacoes.id,
        aprovadoPorUsuarioId: aprovacoes.aprovadoPorUsuarioId,
      })
      .from(aprovacoes)
      .where(and(eq(aprovacoes.versaoMaterialId, versao.id), isNull(aprovacoes.revogadaEm)))
    if (aprovacoesAtuais.some((item) => item.aprovadoPorUsuarioId === req.sessao!.usuarioId))
      throw new ErroHttp(409, 'Voce ja enviou esta versao para aprovacao.', 'aprovacao_duplicada')

    const [versaoInfo] = await banco
      .select({ numero: versoesMaterial.numero })
      .from(versoesMaterial)
      .where(eq(versoesMaterial.id, versao.id))
      .limit(1)
    const numeroVersao = versaoInfo?.numero ?? 1

    const agora = new Date()
    const id = novoId()
    const atividadeId = novoId()
    const idsAprovadores = aprovadores
    const jaAprovaram = new Set(
      aprovacoesAtuais
        .map((item) => item.aprovadoPorUsuarioId)
        .filter((valor): valor is string => Boolean(valor)),
    )
    jaAprovaram.add(req.sessao!.usuarioId)
    const exigeTodos = projeto?.modoAprovacao === 'todos' && idsAprovadores.length > 1
    const prontoParaCliente =
      !exigeTodos || idsAprovadores.every((aprovadorId) => jaAprovaram.has(aprovadorId))
    const faltam = exigeTodos
      ? idsAprovadores.filter((aprovadorId) => !jaAprovaram.has(aprovadorId)).length
      : 0
    const tipoAtividade = prontoParaCliente ? 'enviado_para_aprovacao' : 'aprovacao_parcial'
    const nomeAprovador = req.sessao!.usuarioNome
    const aprovadoresPendentes = exigeTodos
      ? idsAprovadores.filter((aprovadorId) => !jaAprovaram.has(aprovadorId))
      : []
    const descricaoAtividade = acaoEnvioAprovacaoAtividade({
      numeroVersao,
      prontoParaCliente,
      faltam,
    })
    const tituloNotificacao = prontoParaCliente
      ? 'Enviado para aprovação do cliente'
      : 'Envio parcial registrado'
    const descricaoNotificacao = descricaoEnvioAprovacaoNotificacao({
      autorNome: nomeAprovador,
      numeroVersao,
      prontoParaCliente,
      faltam,
    })

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
      // Nunca marca versao/material como aprovado aqui — só o portal (Cliente 2) faz isso.
      await tx
        .update(materiais)
        .set({
          status: prontoParaCliente ? 'aguardando_revisao' : 'aguardando_aprovacao',
          atualizadoEm: agora,
        })
        .where(eq(materiais.id, m.id))
      await recalcularStatusProjeto(m.projetoId, agora, tx)
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: tipoAtividade,
        descricao: descricaoAtividade,
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: tituloNotificacao,
        descricao: descricaoNotificacao,
        tipo: tipoAtividade,
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: m.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: prontoParaCliente
        ? `${nomeAprovador} enviou "${m.nome}" (V${numeroVersao}) para sua aprovação.`
        : `${nomeAprovador} registrou o envio de "${m.nome}" (V${numeroVersao}). Ainda falta ${faltam} confirmação${faltam === 1 ? '' : 'ões'} interna${faltam === 1 ? '' : 's'}.`,
    })
    res.status(201).json({
      dado: {
        id,
        /** Compat: indica que o checklist interno terminou e o material está com o Cliente 2. */
        materialFinalizado: prontoParaCliente,
        prontoParaCliente,
        aprovacoesRegistradas: jaAprovaram.size,
        aprovadoresNecessarios: exigeTodos ? idsAprovadores.length : 1,
        aprovadoresPendentes,
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
    const observacao = req.body.observacao?.trim()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await recalcularStatusProjeto(m.projetoId, agora, tx)
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: 'alteracoes_solicitadas',
        descricao: observacao
          ? `solicitou alterações: ${observacao}`
          : `solicitou alterações em ${m.nome}`,
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: 'Alteracoes solicitadas',
        descricao: `${req.sessao!.usuarioNome} solicitou alterações em "${m.nome}".`,
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
        .set({ status: 'aguardando_revisao', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await tx
        .update(aprovacoes)
        .set({ revogadaEm: agora })
        .where(and(eq(aprovacoes.materialId, m.id), isNull(aprovacoes.revogadaEm)))
      await tx
        .update(versoesMaterial)
        .set({ aprovada: false })
        .where(eq(versoesMaterial.materialId, m.id))
      await recalcularStatusProjeto(m.projetoId, agora, tx)
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: m.versaoAtualId!,
        tipo: 'revisao_reaberta',
        descricao: 'reabriu a revisão para o cliente',
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: 'Revisao reaberta',
        descricao: 'O material voltou ao fluxo de revisao do cliente.',
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

aprovacoesRotas.get('/materiais/:materialId/aprovadores', async (req, res) => {
  const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
  const [projeto] = await banco
    .select({ modoAprovacao: projetos.modoAprovacao })
    .from(projetos)
    .where(eq(projetos.id, m.projetoId))
    .limit(1)
  const aprovadores = await banco
    .select({ usuarioId: participantesProjeto.usuarioId })
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
          and(eq(aprovacoes.versaoMaterialId, m.versaoAtualId), isNull(aprovacoes.revogadaEm)),
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
