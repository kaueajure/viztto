import { Router, type Request, type Response } from 'express'
import { and, count, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  atividades,
  comentarios,
  materiais,
  notificacoes,
  versoesMaterial,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { notificarClienteProjetoAlterado } from '../../servicos/notificar-cliente-projeto.servico.js'
import { garantirTransicaoMaterial } from '../../servicos/material-workflow.servico.js'
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
async function enviarParaAprovacaoHandler(req: Request, res: Response) {
  const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
  garantirTransicaoMaterial(m.status, 'enviar_para_aprovacao')
  const versao = await validarVersaoAtual(m.id, req.body.versaoMaterialId, m.versaoAtualId!)

  const [abertos] = await banco
    .select({ total: count() })
    .from(comentarios)
    .where(
      and(
        eq(comentarios.versaoMaterialId, versao.id),
        eq(comentarios.status, 'aberto'),
        eq(comentarios.tipo, 'solicitacao_alteracao'),
        isNull(comentarios.excluidoEm),
      ),
    )
  if ((abertos?.total ?? 0) > 0 && !req.body.confirmarPendencias)
    throw new ErroHttp(
      409,
      'Esta versao possui solicitacoes de alteracao pendentes. Confirme para enviar.',
      'pendencias_abertas',
      { total: abertos?.total },
    )

  const [versaoInfo] = await banco
    .select({ numero: versoesMaterial.numero })
    .from(versoesMaterial)
    .where(eq(versoesMaterial.id, versao.id))
    .limit(1)
  const numeroVersao = versaoInfo?.numero ?? 1
  const agora = new Date()
  const atividadeId = novoId()
  const nomeAprovador = req.sessao!.usuarioNome
  const descricaoAtividade = acaoEnvioAprovacaoAtividade({
    numeroVersao,
    prontoParaCliente: true,
    faltam: 0,
  })
  const descricaoNotificacao = descricaoEnvioAprovacaoNotificacao({
    autorNome: nomeAprovador,
    numeroVersao,
    prontoParaCliente: true,
    faltam: 0,
  })

  await banco.transaction(async (tx) => {
    await tx
      .update(materiais)
      .set({
        status: 'aguardando_revisao',
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
      tipo: 'enviado_para_aprovacao',
      descricao: descricaoAtividade,
      criadoEm: agora,
    })
    await tx.insert(notificacoes).values({
      id: novoId(),
      workspaceId: m.workspaceId,
      usuarioId: req.sessao!.usuarioId,
      atividadeId,
      titulo: 'Enviado para aprovação do cliente',
      descricao: descricaoNotificacao,
      tipo: 'enviado_para_aprovacao',
      criadoEm: agora,
    })
  })
  await notificarClienteProjetoAlterado({
    projetoId: m.projetoId,
    workspaceId: req.sessao!.workspaceId,
    resumo: `${nomeAprovador} enviou "${m.nome}" (V${numeroVersao}) para sua aprovação.`,
  })
  res.status(201).json({
    dado: {
      materialFinalizado: true,
      prontoParaCliente: true,
    },
  })
}

aprovacoesRotas.post(
  '/materiais/:materialId/enviar-para-aprovacao',
  exigirFuncao('atendimento'),
  validarCorpo(decisao),
  enviarParaAprovacaoHandler,
)

/** Alias legado — mesmo comportamento de enviar-para-aprovacao. */
aprovacoesRotas.post(
  '/materiais/:materialId/aprovar',
  exigirFuncao('atendimento'),
  validarCorpo(decisao),
  enviarParaAprovacaoHandler,
)

aprovacoesRotas.post(
  '/materiais/:materialId/solicitar-alteracoes',
  exigirFuncao('atendimento'),
  validarCorpo(versaoSelecionada),
  async (req, res) => {
    const m = await materialValido(String(req.params.materialId), req.sessao!.workspaceId)
    garantirTransicaoMaterial(m.status, 'solicitar_alteracoes')
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
        .update(comentarios)
        .set({ tipo: 'solicitacao_alteracao', atualizadoEm: agora })
        .where(
          and(
            eq(comentarios.versaoMaterialId, versao.id),
            eq(comentarios.status, 'aberto'),
            isNull(comentarios.excluidoEm),
          ),
        )
      if (observacao) {
        await tx.insert(comentarios).values({
          id: novoId(),
          workspaceId: m.workspaceId,
          materialId: m.id,
          versaoMaterialId: versao.id,
          usuarioId: req.sessao!.usuarioId,
          tipo: 'solicitacao_alteracao',
          texto: observacao,
          posicaoX: '0.5000000',
          posicaoY: '0.5000000',
          status: 'aberto',
          criadoEm: agora,
          atualizadoEm: agora,
        })
      }
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
    garantirTransicaoMaterial(m.status, 'reabrir')
    const agora = new Date()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'aguardando_revisao', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
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
  res.json({
    dado: {
      modoAprovacao: 'qualquer',
      versaoMaterialId: m.versaoAtualId,
      aprovadores: [],
      registros: [],
      mensagem: 'A aprovacao final e feita por contatos externos do Cliente 2 no portal.',
    },
  })
})
