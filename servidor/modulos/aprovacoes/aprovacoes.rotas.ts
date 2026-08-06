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
const versaoSelecionada = z.object({ versaoMaterialId: z.string().uuid() })
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

aprovacoesRotas.post(
  '/materiais/:materialId/aprovar',
  exigirFuncao('atendimento'),
  validarCorpo(decisao),
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
    if ((abertos?.total ?? 0) > 0 && !req.body.confirmarPendencias)
      throw new ErroHttp(
        409,
        'Esta versao possui comentarios pendentes. Confirme para aprovar.',
        'pendencias_abertas',
        { total: abertos?.total },
      )
    const agora = new Date()
    const id = novoId()
    const atividadeId = novoId()
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
      await tx
        .update(versoesMaterial)
        .set({ aprovada: true })
        .where(eq(versoesMaterial.id, versao.id))
      await tx
        .update(materiais)
        .set({ status: 'aprovado', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await tx
        .update(projetos)
        .set({ status: 'aprovado', atualizadoEm: agora })
        .where(eq(projetos.id, m.projetoId))
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: 'versao_aprovada',
        descricao: 'Versao aprovada e decisao registrada',
        criadoEm: agora,
      })
      await tx.insert(notificacoes).values({
        id: novoId(),
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        atividadeId,
        titulo: 'Versao aprovada',
        descricao: 'A decisao foi registrada no historico do material.',
        tipo: 'versao_aprovada',
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoAlterado({
      projetoId: m.projetoId,
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} aprovou uma versao do material "${m.nome}".`,
    })
    res.status(201).json({ dado: { id } })
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
    if (!(abertos?.total ?? 0))
      throw new ErroHttp(422, 'Adicione ao menos um comentario pendente.', 'sem_pendencias')
    const agora = new Date()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(materiais.id, m.id))
      await tx
        .update(projetos)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(projetos.id, m.projetoId))
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: m.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: m.projetoId,
        materialId: m.id,
        versaoMaterialId: versao.id,
        tipo: 'alteracoes_solicitadas',
        descricao: 'Alteracoes solicitadas nesta versao',
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
