import { Router } from 'express'
import { and, count, desc, eq, isNull, like } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { atividades, clientes, projetos } from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { consultaPaginada, paginar } from '../../utilitarios/paginacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import {
  notificarClienteProjetoAlterado,
  notificarClienteProjetoCriado,
  reenviarSenhaPortalProjeto,
} from '../../servicos/notificar-cliente-projeto.servico.js'
import { garantirPodeCriarProjeto } from '../../servicos/limites-plano.servico.js'
import {
  gerarHashSenhaAcesso,
  gerarSenhaAcessoProjeto,
} from '../../servicos/projeto-acesso.servico.js'

function semHashSenha<T extends { senhaAcessoHash?: string | null }>(projeto: T) {
  const { senhaAcessoHash: _omitido, ...resto } = projeto
  void _omitido
  return resto
}

const dadosProjeto = z.object({
  clienteId: z.string().uuid(),
  nome: z.string().trim().min(2).max(200),
  descricao: z.string().max(5000).optional().nullable(),
  tipo: z.string().trim().min(2).max(80),
  status: z
    .enum([
      'rascunho',
      'em_revisao',
      'alteracoes_solicitadas',
      'aguardando_aprovacao',
      'aprovado',
      'arquivado',
    ])
    .optional(),
  prazoEm: z.coerce.date().optional().nullable(),
})
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
  res.json(paginar(q.pagina, q.porPagina, c?.total ?? 0, dados.map(semHashSenha)))
})

projetosRotas.post(
  '/',
  exigirFuncao('atendimento'),
  validarCorpo(dadosProjeto),
  async (req, res) => {
    const [cliente] = await banco
      .select({ id: clientes.id })
      .from(clientes)
      .where(
        and(
          eq(clientes.id, req.body.clienteId),
          eq(clientes.workspaceId, req.sessao!.workspaceId),
          isNull(clientes.excluidoEm),
        ),
      )
      .limit(1)
    if (!cliente)
      throw new ErroHttp(422, 'Cliente invalido para este workspace.', 'cliente_invalido')
    await garantirPodeCriarProjeto(req.sessao!.workspaceId)
    const agora = new Date()
    const id = novoId()
    const senhaAcesso = gerarSenhaAcessoProjeto()
    const senhaAcessoHash = await gerarHashSenhaAcesso(senhaAcesso)
    await banco.transaction(async (tx) => {
      await tx.insert(projetos).values({
        id,
        workspaceId: req.sessao!.workspaceId,
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        atualizadoEm: agora,
        ...req.body,
        senhaAcessoHash,
      })
      await tx.insert(atividades).values({
        id: novoId(),
        workspaceId: req.sessao!.workspaceId,
        usuarioId: req.sessao!.usuarioId,
        projetoId: id,
        tipo: 'projeto_criado',
        descricao: `Projeto ${req.body.nome} criado`,
        criadoEm: agora,
      })
    })
    await notificarClienteProjetoCriado({
      projetoId: id,
      workspaceId: req.sessao!.workspaceId,
      criadorNome: req.sessao!.usuarioNome,
      senhaAcesso,
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
  if (!dado) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  res.json({ dado: semHashSenha(dado) })
})
projetosRotas.post('/:projetoId/senha-portal', exigirFuncao('atendimento'), async (req, res) => {
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
  if (!projeto) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  const senhaAcesso = gerarSenhaAcessoProjeto()
  const envio = await reenviarSenhaPortalProjeto({
    projetoId,
    workspaceId: req.sessao!.workspaceId,
    criadorNome: req.sessao!.usuarioNome,
    senhaAcesso,
  })
  if (!envio.enviado) {
    if (envio.motivo === 'cliente_sem_email')
      throw new ErroHttp(
        422,
        'Cadastre o e-mail do cliente antes de reenviar a senha.',
        'cliente_sem_email',
      )
    throw new ErroHttp(
      503,
      'Nao foi possivel enviar a nova senha. Tente novamente.',
      'email_falhou',
    )
  }
  const agora = new Date()
  await banco
    .update(projetos)
    .set({ senhaAcessoHash: await gerarHashSenhaAcesso(senhaAcesso), atualizadoEm: agora })
    .where(eq(projetos.id, projetoId))
  res.json({ mensagem: 'Nova senha gerada e enviada ao cliente.' })
})
projetosRotas.patch(
  '/:projetoId',
  exigirFuncao('atendimento'),
  validarCorpo(dadosProjeto.partial()),
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
      throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
    await notificarClienteProjetoAlterado({
      projetoId: String(req.params.projetoId),
      workspaceId: req.sessao!.workspaceId,
      resumo: `${req.sessao!.usuarioNome} atualizou os dados do projeto.`,
    })
    res.json({ mensagem: 'Projeto atualizado.' })
  },
)
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
    throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  res.status(204).end()
})
