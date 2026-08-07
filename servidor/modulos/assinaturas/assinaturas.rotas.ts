import { Router } from 'express'
import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import { assinaturas, planosAssinatura, workspaces } from '../../banco/esquema/index.js'
import { exigirAdmin, exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import {
  atualizarPlanoMercadoPago,
  criarAssinaturaMercadoPago,
  criarPlanoMercadoPago,
  diagnosticarConfiguracaoMercadoPago,
  planoPertenceAoVendedorMercadoPago,
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

assinaturasRotas.get('/planos', async (req, res) => {
  const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
  const [dados, [assinaturaAtual]] = await Promise.all([
    banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.ativo, true))
      .orderBy(asc(planosAssinatura.valorMensal)),
    banco
      .select({ codigoPlano: planosAssinatura.codigo })
      .from(assinaturas)
      .innerJoin(planosAssinatura, eq(planosAssinatura.id, assinaturas.planoAssinaturaId))
      .where(
        and(
          eq(assinaturas.workspaceId, req.sessao!.workspaceId),
          eq(assinaturas.status, 'autorizada'),
        ),
      )
      .orderBy(desc(assinaturas.atualizadoEm))
      .limit(1),
  ])
  res.json({
    dados,
    assinaturaAtual: assinaturaAtual?.codigoPlano ?? null,
    integracao: {
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      chavePublica: ambiente.MERCADO_PAGO_PUBLIC_KEY ?? null,
      configurada: !problemaIntegracao,
      emailPagadorTeste:
        ambiente.MERCADO_PAGO_AMBIENTE === 'teste'
          ? (ambiente.MERCADO_PAGO_EMAIL_PAGADOR_TESTE ?? null)
          : null,
      problemaConfiguracao: problemaIntegracao,
    },
  })
})

assinaturasRotas.get('/admin/planos', exigirAdmin, async (_req, res) => {
  const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
  const dados = await banco
    .select()
    .from(planosAssinatura)
    .orderBy(asc(planosAssinatura.valorMensal))
  res.json({
    dados,
    integracao: {
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      configurada: !problemaIntegracao,
      chavePublicaConfigurada: Boolean(ambiente.MERCADO_PAGO_PUBLIC_KEY),
      webhookConfigurado: Boolean(ambiente.MERCADO_PAGO_WEBHOOK_SECRET),
      problemaConfiguracao: problemaIntegracao,
    },
  })
})

assinaturasRotas.post(
  '/criar',
  exigirFuncao('administrador'),
  validarCorpo(criarAssinaturaEntrada),
  async (req, res) => {
    const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
    if (problemaIntegracao)
      throw new ErroHttp(503, problemaIntegracao, 'mercado_pago_assinaturas_nao_configurado')
    const [plano] = await banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.codigo, req.body.codigoPlano))
      .limit(1)
    if (!plano?.ativo) throw new ErroHttp(404, 'Plano indisponivel.', 'plano_indisponivel')
    let planoRemotoId = plano.mercadoPagoPlanoId
    if (!planoRemotoId || !(await planoPertenceAoVendedorMercadoPago(planoRemotoId))) {
      const remotoCriado = await criarPlanoMercadoPago({
        nome: plano.nome,
        valor: Number(plano.valorMensal),
        backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
      })
      planoRemotoId = remotoCriado.id
      await banco
        .update(planosAssinatura)
        .set({
          mercadoPagoPlanoId: remotoCriado.id,
          mercadoPagoStatus: remotoCriado.status ?? 'active',
          atualizadoEm: new Date(),
        })
        .where(eq(planosAssinatura.id, plano.id))
    }

    const id = novoId()
    const referenciaExterna = `viztto:${ambiente.MERCADO_PAGO_AMBIENTE}:${id}`
    const emailPagador =
      ambiente.MERCADO_PAGO_AMBIENTE === 'teste'
        ? ambiente.MERCADO_PAGO_EMAIL_PAGADOR_TESTE
        : req.body.emailPagador
    if (!emailPagador)
      throw new ErroHttp(
        503,
        diagnosticarConfiguracaoMercadoPago() ?? 'Pagador de teste nao configurado.',
        'mercado_pago_teste_nao_configurado',
      )
    const remoto = await criarAssinaturaMercadoPago({
      planoId: planoRemotoId,
      referenciaExterna,
      emailPagador,
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
      emailPagador,
      status: remoto.status === 'authorized' ? 'autorizada' : 'pendente',
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      criadaPorUsuarioId: req.sessao!.usuarioId,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    })
    if (remoto.status === 'authorized')
      await banco
        .update(workspaces)
        .set({ plano: plano.codigo, atualizadoEm: new Date() })
        .where(eq(workspaces.id, req.sessao!.workspaceId))
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
  const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
  if (problemaIntegracao)
    throw new ErroHttp(503, problemaIntegracao, 'mercado_pago_assinaturas_nao_configurado')
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
  const planoRemotoId = plano.mercadoPagoPlanoId
  const planoCompativel = planoRemotoId
    ? await planoPertenceAoVendedorMercadoPago(planoRemotoId)
    : false
  const remoto =
    planoCompativel && planoRemotoId
      ? await atualizarPlanoMercadoPago(planoRemotoId, entrada)
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
