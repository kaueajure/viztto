import { Router } from 'express'
import { and, count, desc, eq, isNull, like } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { atividades, clientes, projetos, workspaces } from '../../banco/esquema/index.js'
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

function semSegredosPortal<T extends { senhaAcessoHash?: string | null }>(projeto: T) {
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
  res.json(paginar(q.pagina, q.porPagina, c?.total ?? 0, dados.map(semSegredosPortal)))
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
    const { plano } = await carregarPlanoDoWorkspace(req.sessao!.workspaceId)
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
        ...req.body,
        tokenPortal,
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
  if (!dado) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  res.json({ dado: semSegredosPortal(dado) })
})

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
  if (!projeto) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  let token = projeto.tokenPortal
  if (!token) {
    token = gerarTokenPortal()
    await banco
      .update(projetos)
      .set({ tokenPortal: token, atualizadoEm: new Date() })
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
  if (!projeto) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  const tokenPortal = gerarTokenPortal()
  await banco
    .update(projetos)
    .set({ tokenPortal, atualizadoEm: new Date() })
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
      throw new ErroHttp(500, 'Token do portal nao foi gerado.', 'token_ausente')
    throw new ErroHttp(
      503,
      'Nao foi possivel enviar o link. Tente novamente.',
      'email_falhou',
    )
  }
  const [ws] = await banco
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, req.sessao!.workspaceId))
    .limit(1)
  res.json({
    mensagem: 'Novo link gerado e enviado ao cliente. Links anteriores deixaram de funcionar.',
    dado: {
      tokenPortal,
      link: ws ? linkPortalProjeto(projetoId, ws.slug, tokenPortal) : null,
    },
  })
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
