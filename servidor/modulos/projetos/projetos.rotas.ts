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
  res.json(paginar(q.pagina, q.porPagina, c?.total ?? 0, dados))
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
    const agora = new Date()
    const id = novoId()
    await banco.transaction(async (tx) => {
      await tx.insert(projetos).values({
        id,
        workspaceId: req.sessao!.workspaceId,
        criadoPorUsuarioId: req.sessao!.usuarioId,
        criadoEm: agora,
        atualizadoEm: agora,
        ...req.body,
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
  res.json({ dado })
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
