import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import { assinaturas, planosAssinatura } from '../../banco/esquema/index.js'
import { exigirAdmin, exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import {
  atualizarPlanoMercadoPago,
  criarAssinaturaMercadoPago,
  criarPlanoMercadoPago,
  mercadoPagoConfigurado,
} from '../../integracoes/mercado-pago.js'
import { novoId } from '../../utilitarios/seguranca.js'

const codigoPlano = z.enum(['freelancer', 'studio', 'agency'])
const atualizarEntrada = z.object({
  valorMensal: z.number().positive().max(100_000),
  ativo: z.boolean(),
})
const criarAssinaturaEntrada = z.object({
  codigoPlano,
  tokenCartao: z.string().trim().min(20).max(300),
  emailPagador: z.string().email(),
})

export const assinaturasRotas = Router()

assinaturasRotas.get('/planos', async (_req, res) => {
  const dados = await banco
    .select()
    .from(planosAssinatura)
    .orderBy(asc(planosAssinatura.valorMensal))
  res.json({ dados, integracao: { ambiente: ambiente.MERCADO_PAGO_AMBIENTE } })
})

assinaturasRotas.get('/admin/planos', exigirAdmin, async (_req, res) => {
  const dados = await banco
    .select()
    .from(planosAssinatura)
    .orderBy(asc(planosAssinatura.valorMensal))
  res.json({
    dados,
    integracao: {
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      configurada: mercadoPagoConfigurado(),
      chavePublicaConfigurada: Boolean(ambiente.MERCADO_PAGO_PUBLIC_KEY),
      webhookConfigurado: Boolean(ambiente.MERCADO_PAGO_WEBHOOK_SECRET),
    },
  })
})

assinaturasRotas.post(
  '/criar',
  exigirFuncao('administrador'),
  validarCorpo(criarAssinaturaEntrada),
  async (req, res) => {
    const [plano] = await banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.codigo, req.body.codigoPlano))
      .limit(1)
    if (!plano?.ativo) throw new ErroHttp(404, 'Plano indisponivel.', 'plano_indisponivel')
    if (!plano.mercadoPagoPlanoId)
      throw new ErroHttp(409, 'O plano ainda nao foi sincronizado.', 'plano_nao_sincronizado')

    const id = novoId()
    const referenciaExterna = `viztto:${ambiente.MERCADO_PAGO_AMBIENTE}:${id}`
    const remoto = await criarAssinaturaMercadoPago({
      planoId: plano.mercadoPagoPlanoId,
      referenciaExterna,
      emailPagador: req.body.emailPagador,
      tokenCartao: req.body.tokenCartao,
      motivo: `Viztto ${plano.nome}`,
      backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
    })
    await banco.insert(assinaturas).values({
      id,
      workspaceId: req.sessao!.workspaceId,
      planoAssinaturaId: plano.id,
      mercadoPagoAssinaturaId: remoto.id,
      referenciaExterna,
      emailPagador: req.body.emailPagador,
      status: remoto.status === 'authorized' ? 'autorizada' : 'pendente',
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      criadaPorUsuarioId: req.sessao!.usuarioId,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    })
    res.status(201).json({ dado: { id, status: remoto.status } })
  },
)

assinaturasRotas.patch(
  '/admin/planos/:codigo',
  exigirAdmin,
  validarCorpo(atualizarEntrada),
  async (req, res) => {
    const codigo = codigoPlano.parse(req.params.codigo)
    const [plano] = await banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.codigo, codigo))
      .limit(1)
    if (!plano) throw new ErroHttp(404, 'Plano nao encontrado.', 'plano_nao_encontrado')
    await banco
      .update(planosAssinatura)
      .set({
        valorMensal: String(req.body.valorMensal),
        ativo: req.body.ativo,
        atualizadoPorUsuarioId: req.sessao!.usuarioId,
        atualizadoEm: new Date(),
      })
      .where(eq(planosAssinatura.id, plano.id))
    res.json({ mensagem: 'Preco do plano atualizado. Sincronize para aplicar no Mercado Pago.' })
  },
)

assinaturasRotas.post('/admin/planos/:codigo/sincronizar', exigirAdmin, async (req, res) => {
  const codigo = codigoPlano.parse(req.params.codigo)
  const [plano] = await banco
    .select()
    .from(planosAssinatura)
    .where(eq(planosAssinatura.codigo, codigo))
    .limit(1)
  if (!plano) throw new ErroHttp(404, 'Plano nao encontrado.', 'plano_nao_encontrado')
  const entrada = {
    nome: plano.nome,
    valor: Number(plano.valorMensal),
    backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
  }
  const remoto = plano.mercadoPagoPlanoId
    ? await atualizarPlanoMercadoPago(plano.mercadoPagoPlanoId, entrada)
    : await criarPlanoMercadoPago(entrada)
  await banco
    .update(planosAssinatura)
    .set({
      mercadoPagoPlanoId: remoto.id ?? plano.mercadoPagoPlanoId,
      mercadoPagoStatus: remoto.status ?? 'active',
      atualizadoPorUsuarioId: req.sessao!.usuarioId,
      atualizadoEm: new Date(),
    })
    .where(eq(planosAssinatura.id, plano.id))
  res.json({ mensagem: `Plano sincronizado no ambiente de ${ambiente.MERCADO_PAGO_AMBIENTE}.` })
})
