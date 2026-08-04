import { Router } from 'express'
import { and, count, desc, eq, isNull, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { atividades, clientes } from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { consultaPaginada, paginar } from '../../utilitarios/paginacao.js'
import { novoId } from '../../utilitarios/seguranca.js'

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
