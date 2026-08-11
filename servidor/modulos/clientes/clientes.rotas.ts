import { Router } from 'express'
import { and, count, desc, eq, isNull, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { atividades, clientes, contatosCliente } from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { consultaPaginada, paginar } from '../../utilitarios/paginacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { garantirPodeCriarCliente } from '../../servicos/limites-plano.servico.js'
import {
  listarContatosDoCliente,
  normalizarEmailContato,
  obterContatoPorEmail,
} from '../../servicos/contatos-cliente.servico.js'

const dadosCliente = z.object({
  nome: z.string().trim().min(2).max(180),
  empresa: z.string().trim().max(180).optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().trim().max(40).optional().nullable(),
  observacoes: z.string().trim().max(5000).optional().nullable(),
  corIdentificacao: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional()
    .nullable(),
  status: z.enum(['ativo', 'arquivado']).optional(),
})

export const clientesRotas = Router()

clientesRotas.get('/', async (req, res) => {
  const q = consultaPaginada.parse(req.query)
  const workspaceId = req.sessao!.workspaceId
  const filtroBusca = q.busca
    ? or(like(clientes.nome, `%${q.busca}%`), like(clientes.empresa, `%${q.busca}%`))
    : undefined
  const filtro = and(
    eq(clientes.workspaceId, workspaceId),
    isNull(clientes.excluidoEm),
    filtroBusca,
  )
  const [[contagem], dados] = await Promise.all([
    banco.select({ total: count() }).from(clientes).where(filtro),
    banco
      .select()
      .from(clientes)
      .where(filtro)
      .orderBy(desc(clientes.atualizadoEm))
      .limit(q.porPagina)
      .offset((q.pagina - 1) * q.porPagina),
  ])
  res.json(paginar(q.pagina, q.porPagina, contagem?.total ?? 0, dados))
})

clientesRotas.post(
  '/',
  exigirFuncao('atendimento'),
  validarCorpo(dadosCliente),
  async (req, res) => {
    await garantirPodeCriarCliente(req.sessao!.workspaceId)
    const agora = new Date()
    const id = novoId()
    await banco.transaction(async (tx) => {
      await tx.insert(clientes).values({
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
        tipo: 'cliente_criado',
        descricao: `Cliente ${req.body.nome} criado`,
        criadoEm: agora,
      })
    })
    const [cliente] = await banco.select().from(clientes).where(eq(clientes.id, id)).limit(1)
    res.status(201).json({ dado: cliente })
  },
)

clientesRotas.get('/:clienteId', async (req, res) => {
  const [cliente] = await banco
    .select()
    .from(clientes)
    .where(
      and(
        eq(clientes.id, String(req.params.clienteId)),
        eq(clientes.workspaceId, req.sessao!.workspaceId),
        isNull(clientes.excluidoEm),
      ),
    )
    .limit(1)
  if (!cliente) throw new ErroHttp(404, 'Cliente nao encontrado.', 'cliente_nao_encontrado')
  res.json({ dado: cliente })
})

clientesRotas.patch(
  '/:clienteId',
  exigirFuncao('atendimento'),
  validarCorpo(dadosCliente.partial()),
  async (req, res) => {
    const resultado = await banco
      .update(clientes)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(
        and(
          eq(clientes.id, String(req.params.clienteId)),
          eq(clientes.workspaceId, req.sessao!.workspaceId),
          isNull(clientes.excluidoEm),
        ),
      )
    if (!resultado[0].affectedRows)
      throw new ErroHttp(404, 'Cliente nao encontrado.', 'cliente_nao_encontrado')
    res.json({ mensagem: 'Cliente atualizado.' })
  },
)

clientesRotas.delete('/:clienteId', exigirFuncao('gestor'), async (req, res) => {
  const resultado = await banco
    .update(clientes)
    .set({ excluidoEm: new Date(), atualizadoEm: new Date() })
    .where(
      and(
        eq(clientes.id, String(req.params.clienteId)),
        eq(clientes.workspaceId, req.sessao!.workspaceId),
        isNull(clientes.excluidoEm),
      ),
    )
  if (!resultado[0].affectedRows)
    throw new ErroHttp(404, 'Cliente nao encontrado.', 'cliente_nao_encontrado')
  res.status(204).end()
})

const dadosContato = z.object({
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  podeComentar: z.boolean().optional(),
  podeSolicitarAlteracoes: z.boolean().optional(),
  podeAprovar: z.boolean().optional(),
})

async function clienteDoWorkspace(clienteId: string, workspaceId: string) {
  const [cliente] = await banco
    .select({ id: clientes.id })
    .from(clientes)
    .where(
      and(
        eq(clientes.id, clienteId),
        eq(clientes.workspaceId, workspaceId),
        isNull(clientes.excluidoEm),
      ),
    )
    .limit(1)
  if (!cliente) throw new ErroHttp(404, 'Cliente nao encontrado.', 'cliente_nao_encontrado')
  return cliente
}

clientesRotas.get('/:clienteId/contatos', async (req, res) => {
  const clienteId = String(req.params.clienteId)
  await clienteDoWorkspace(clienteId, req.sessao!.workspaceId)
  const lista = await listarContatosDoCliente(clienteId, req.sessao!.workspaceId)
  res.json({ dados: lista })
})

clientesRotas.post(
  '/:clienteId/contatos',
  exigirFuncao('atendimento'),
  validarCorpo(dadosContato),
  async (req, res) => {
    const clienteId = String(req.params.clienteId)
    const workspaceId = req.sessao!.workspaceId
    await clienteDoWorkspace(clienteId, workspaceId)
    const email = normalizarEmailContato(req.body.email)
    const existente = await obterContatoPorEmail(clienteId, email, workspaceId)
    if (existente)
      throw new ErroHttp(409, 'Ja existe um contato com este email.', 'contato_duplicado')

    const agora = new Date()
    const id = novoId()
    await banco.insert(contatosCliente).values({
      id,
      workspaceId,
      clienteId,
      nome: req.body.nome,
      email,
      podeComentar: req.body.podeComentar ?? true,
      podeSolicitarAlteracoes: req.body.podeSolicitarAlteracoes ?? true,
      podeAprovar: req.body.podeAprovar ?? false,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    const [contato] = await banco
      .select()
      .from(contatosCliente)
      .where(eq(contatosCliente.id, id))
      .limit(1)
    res.status(201).json({ dado: contato })
  },
)

clientesRotas.patch(
  '/:clienteId/contatos/:contatoId',
  exigirFuncao('atendimento'),
  validarCorpo(dadosContato.partial()),
  async (req, res) => {
    const clienteId = String(req.params.clienteId)
    const contatoId = String(req.params.contatoId)
    const workspaceId = req.sessao!.workspaceId
    await clienteDoWorkspace(clienteId, workspaceId)

    const patch: Record<string, unknown> = { atualizadoEm: new Date() }
    if (req.body.nome != null) patch.nome = req.body.nome
    if (req.body.email != null) {
      const email = normalizarEmailContato(req.body.email)
      const outro = await obterContatoPorEmail(clienteId, email, workspaceId)
      if (outro && outro.id !== contatoId)
        throw new ErroHttp(409, 'Ja existe um contato com este email.', 'contato_duplicado')
      patch.email = email
    }
    if (req.body.podeComentar != null) patch.podeComentar = req.body.podeComentar
    if (req.body.podeSolicitarAlteracoes != null)
      patch.podeSolicitarAlteracoes = req.body.podeSolicitarAlteracoes
    if (req.body.podeAprovar != null) patch.podeAprovar = req.body.podeAprovar

    const resultado = await banco
      .update(contatosCliente)
      .set(patch)
      .where(
        and(
          eq(contatosCliente.id, contatoId),
          eq(contatosCliente.clienteId, clienteId),
          eq(contatosCliente.workspaceId, workspaceId),
          isNull(contatosCliente.excluidoEm),
        ),
      )
    if (!resultado[0].affectedRows)
      throw new ErroHttp(404, 'Contato nao encontrado.', 'contato_nao_encontrado')
    res.json({ mensagem: 'Contato atualizado.' })
  },
)

clientesRotas.delete(
  '/:clienteId/contatos/:contatoId',
  exigirFuncao('atendimento'),
  async (req, res) => {
    const clienteId = String(req.params.clienteId)
    const contatoId = String(req.params.contatoId)
    const workspaceId = req.sessao!.workspaceId
    await clienteDoWorkspace(clienteId, workspaceId)
    const resultado = await banco
      .update(contatosCliente)
      .set({
        excluidoEm: new Date(),
        atualizadoEm: new Date(),
        email: `${Date.now()}-deleted-${contatoId}@deleted.local`,
      })
      .where(
        and(
          eq(contatosCliente.id, contatoId),
          eq(contatosCliente.clienteId, clienteId),
          eq(contatosCliente.workspaceId, workspaceId),
          isNull(contatosCliente.excluidoEm),
        ),
      )
    if (!resultado[0].affectedRows)
      throw new ErroHttp(404, 'Contato nao encontrado.', 'contato_nao_encontrado')
    res.status(204).end()
  },
)