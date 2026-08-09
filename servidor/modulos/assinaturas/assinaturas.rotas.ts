import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import { assinaturas, planosAssinatura, workspaces } from '../../banco/esquema/index.js'
import { exigirAdmin, exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import {
  atualizarPlanoMercadoPago,
  cancelarAssinaturaMercadoPago,
  criarAssinaturaCheckoutMercadoPago,
  criarAssinaturaMercadoPago,
  criarPagamentoPixMercadoPago,
  criarPlanoMercadoPago,
  dadosPixDoPagamento,
  diagnosticarConfiguracaoMercadoPago,
  erroIndicaPlanoInexistente,
  obterPagamentoMercadoPago,
  planoPertenceAoVendedorMercadoPago,
  urlCheckoutAssinatura,
} from '../../integracoes/mercado-pago.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { obterUsoELimitesDoWorkspace } from '../../servicos/limites-plano.servico.js'
import {
  assinaturaEhPix,
  iniciarCarenciaAssinatura,
  liberarPlanoDaAssinatura,
  obterAssinaturaBillingDoWorkspace,
  reconciliarAssinaturasVencidas,
  supersedirAssinaturasAnteriores,
} from '../../servicos/assinatura-plano.servico.js'

async function garantirPlanoRemoto(plano: typeof planosAssinatura.$inferSelect) {
  const entrada = {
    nome: plano.nome,
    valor: Number(plano.valorMensal),
    backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
  }
  let planoRemotoId = plano.mercadoPagoPlanoId
  const planoCompativel = planoRemotoId
    ? await planoPertenceAoVendedorMercadoPago(planoRemotoId)
    : false
  if (planoCompativel && planoRemotoId) return planoRemotoId

  const remotoCriado = await criarPlanoMercadoPago(entrada)
  planoRemotoId = remotoCriado.id
  await banco
    .update(planosAssinatura)
    .set({
      mercadoPagoPlanoId: remotoCriado.id,
      mercadoPagoStatus: remotoCriado.status ?? 'active',
      atualizadoEm: new Date(),
    })
    .where(eq(planosAssinatura.id, plano.id))
  return planoRemotoId
}

const codigoPlano = z.enum(['gratuito', 'freelancer', 'studio', 'agency'])
const limiteOpcional = z.number().int().positive().max(1_000_000).nullable()
const atualizarEntrada = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().min(2).max(300),
  valorMensal: z.number().min(0).max(100_000),
  ativo: z.boolean(),
  beneficios: z.array(z.string().trim().min(1).max(200)).max(40),
  maxProjetosAtivos: limiteOpcional,
  maxMembros: limiteOpcional,
  maxClientes: limiteOpcional,
  maxArmazenamentoGb: limiteOpcional,
  maxWorkspaces: limiteOpcional,
  permiteIdentidadePersonalizada: z.boolean(),
  permiteCalendarioEditorial: z.boolean(),
  permiteRelatorios: z.boolean(),
  permiteComentariosImagem: z.boolean(),
  permiteComentariosVideo: z.boolean(),
  permiteComentariosPdf: z.boolean(),
  permiteLinksPortalCliente: z.boolean(),
  permiteVariosAprovadores: z.boolean(),
  permiteHistoricoAvancado: z.boolean(),
  permitePrioridadeSuporte: z.boolean(),
  permiteFuncoesAvancadas: z.boolean(),
})
const codigoPlanoPago = z.enum(['freelancer', 'studio', 'agency'])
const criarAssinaturaEntrada = z.object({
  codigoPlano: codigoPlanoPago,
  tokenCartao: z.string().trim().min(20).max(300),
  emailPagador: z.string().email(),
})
const criarCheckoutEntrada = z.object({
  codigoPlano: codigoPlanoPago,
  emailPagador: z.string().email(),
})
const criarPixEntrada = z.object({
  codigoPlano: codigoPlanoPago,
  emailPagador: z.string().email(),
})

async function resolverEmailPagador(emailPagador: string) {
  const email =
    ambiente.MERCADO_PAGO_AMBIENTE === 'teste'
      ? ambiente.MERCADO_PAGO_EMAIL_PAGADOR_TESTE
      : emailPagador
  if (!email)
    throw new ErroHttp(
      503,
      diagnosticarConfiguracaoMercadoPago() ?? 'Pagador de teste não configurado.',
      'mercado_pago_teste_nao_configurado',
    )
  return email
}

async function carregarPlanoAtivo(codigo: z.infer<typeof codigoPlano>) {
  const [plano] = await banco
    .select()
    .from(planosAssinatura)
    .where(eq(planosAssinatura.codigo, codigo))
    .limit(1)
  if (!plano?.ativo) throw new ErroHttp(404, 'Plano indisponivel.', 'plano_indisponivel')
  return plano
}

async function sincronizarPlanoComMercadoPago(
  plano: typeof planosAssinatura.$inferSelect,
  usuarioId: string,
) {
  const entrada = {
    nome: plano.nome,
    valor: Number(plano.valorMensal),
    backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
  }
  const planoRemotoId = plano.mercadoPagoPlanoId
  const planoCompativel = planoRemotoId
    ? await planoPertenceAoVendedorMercadoPago(planoRemotoId)
    : false
  let remoto
  if (planoCompativel && planoRemotoId) {
    try {
      remoto = await atualizarPlanoMercadoPago(planoRemotoId, entrada)
    } catch (erro) {
      if (!erroIndicaPlanoInexistente(erro)) throw erro
      remoto = await criarPlanoMercadoPago(entrada)
    }
  } else {
    remoto = await criarPlanoMercadoPago(entrada)
  }
  await banco
    .update(planosAssinatura)
    .set({
      mercadoPagoPlanoId: remoto.id ?? plano.mercadoPagoPlanoId,
      mercadoPagoStatus: remoto.status ?? 'active',
      atualizadoPorUsuarioId: usuarioId,
      atualizadoEm: new Date(),
    })
    .where(eq(planosAssinatura.id, plano.id))
}

export const assinaturasRotas = Router()

assinaturasRotas.get('/limites', async (req, res) => {
  const workspaceId = req.sessao!.workspaceId
  const dado = await obterUsoELimitesDoWorkspace(workspaceId)
  let billing: Awaited<ReturnType<typeof obterAssinaturaBillingDoWorkspace>> = null
  try {
    billing = await obterAssinaturaBillingDoWorkspace(workspaceId)
  } catch {
    billing = null
  }
  res.json({
    dado: {
      ...dado,
      billing: billing
        ? {
            assinaturaId: billing.id,
            status: billing.status,
            codigoPlano: billing.codigoPlano,
            carenciaAte: billing.carenciaAte,
            vigenciaAte: billing.vigenciaAte,
            motivoStatus: billing.motivoStatus,
            ehPix: assinaturaEhPix(billing),
          }
        : null,
    },
  })
})

assinaturasRotas.get('/planos', async (req, res) => {
  const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
  const [dados, [workspace]] = await Promise.all([
    banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.ativo, true))
      .orderBy(asc(planosAssinatura.valorMensal)),
    banco
      .select({ plano: workspaces.plano })
      .from(workspaces)
      .where(eq(workspaces.id, req.sessao!.workspaceId))
      .limit(1),
  ])
  let billing: Awaited<ReturnType<typeof obterAssinaturaBillingDoWorkspace>> = null
  try {
    billing = await obterAssinaturaBillingDoWorkspace(req.sessao!.workspaceId)
  } catch {
    billing = null
  }
  res.json({
    dados,
    assinaturaAtual: billing?.codigoPlano ?? workspace?.plano ?? 'gratuito',
    assinaturaBilling: billing
      ? {
          id: billing.id,
          status: billing.status,
          carenciaAte: billing.carenciaAte,
          vigenciaAte: billing.vigenciaAte,
          motivoStatus: billing.motivoStatus,
          ehPix: assinaturaEhPix(billing),
        }
      : null,
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
    await supersedirAssinaturasAnteriores(req.sessao!.workspaceId)
    let planoRemotoId = await garantirPlanoRemoto(plano)

    const id = novoId()
    const referenciaExterna = `viztto:${ambiente.MERCADO_PAGO_AMBIENTE}:${id}`
    const emailPagador = await resolverEmailPagador(req.body.emailPagador)
    const payloadAssinatura = {
      planoId: planoRemotoId,
      referenciaExterna,
      emailPagador,
      tokenCartao: req.body.tokenCartao,
      motivo: `Viztto ${plano.nome}`,
      backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes`,
    }
    let remoto
    try {
      remoto = await criarAssinaturaMercadoPago(payloadAssinatura)
    } catch (erro) {
      if (!erroIndicaPlanoInexistente(erro)) throw erro
      // Plano antigo ficou no banco apos troca de credenciais: recria e tenta 1 vez.
      await banco
        .update(planosAssinatura)
        .set({ mercadoPagoPlanoId: null, mercadoPagoStatus: null, atualizadoEm: new Date() })
        .where(eq(planosAssinatura.id, plano.id))
      planoRemotoId = await garantirPlanoRemoto({ ...plano, mercadoPagoPlanoId: null })
      remoto = await criarAssinaturaMercadoPago({ ...payloadAssinatura, planoId: planoRemotoId })
    }
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
    if (remoto.status === 'authorized') {
      const [criada] = await banco.select().from(assinaturas).where(eq(assinaturas.id, id)).limit(1)
      if (criada) await liberarPlanoDaAssinatura(criada, { pix: false })
    }
    res.status(201).json({ dado: { id, status: remoto.status } })
  },
)

assinaturasRotas.post(
  '/criar-checkout',
  exigirFuncao('administrador'),
  validarCorpo(criarCheckoutEntrada),
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
    await supersedirAssinaturasAnteriores(req.sessao!.workspaceId)

    const id = novoId()
    const referenciaExterna = `viztto:${ambiente.MERCADO_PAGO_AMBIENTE}:${id}`
    const emailPagador = await resolverEmailPagador(req.body.emailPagador)
    // Checkout Pix exige assinatura SEM plano associado (MP exige card_token com plano).
    const remoto = await criarAssinaturaCheckoutMercadoPago({
      referenciaExterna,
      emailPagador,
      motivo: `Viztto ${plano.nome}`,
      backUrl: `${ambiente.URL_APLICACAO}/app/configuracoes?assinatura=pendente`,
      valorMensal: Number(plano.valorMensal),
      moeda: plano.moeda || 'BRL',
    })
    const checkoutUrl = urlCheckoutAssinatura(remoto)
    if (!checkoutUrl)
      throw new ErroHttp(
        502,
        'O Mercado Pago não retornou o link de checkout da assinatura.',
        'mercado_pago_checkout_ausente',
      )
    await banco.insert(assinaturas).values({
      id,
      workspaceId: req.sessao!.workspaceId,
      planoAssinaturaId: plano.id,
      mercadoPagoAssinaturaId: remoto.id,
      referenciaExterna,
      emailPagador,
      status: 'pendente',
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      criadaPorUsuarioId: req.sessao!.usuarioId,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    })
    res.status(201).json({
      dado: { id, status: remoto.status, checkoutUrl },
    })
  },
)

assinaturasRotas.post(
  '/criar-pix',
  exigirFuncao('administrador'),
  validarCorpo(criarPixEntrada),
  async (req, res) => {
    const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
    if (problemaIntegracao)
      throw new ErroHttp(503, problemaIntegracao, 'mercado_pago_assinaturas_nao_configurado')
    const plano = await carregarPlanoAtivo(req.body.codigoPlano)
    await supersedirAssinaturasAnteriores(req.sessao!.workspaceId)
    const id = novoId()
    const referenciaExterna = `viztto:${ambiente.MERCADO_PAGO_AMBIENTE}:pix:${id}`
    const emailPagador = await resolverEmailPagador(req.body.emailPagador)
    const pagamento = await criarPagamentoPixMercadoPago({
      referenciaExterna,
      emailPagador,
      descricao: `Viztto ${plano.nome} — mensalidade`,
      valor: Number(plano.valorMensal),
    })
    const pix = dadosPixDoPagamento(pagamento)
    if (!pix.qrCode && !pix.qrCodeBase64)
      throw new ErroHttp(
        502,
        'O Mercado Pago não retornou o QR Code Pix. Confirme se a chave Pix está ativa na conta.',
        'mercado_pago_pix_ausente',
      )
    await banco.insert(assinaturas).values({
      id,
      workspaceId: req.sessao!.workspaceId,
      planoAssinaturaId: plano.id,
      mercadoPagoAssinaturaId: String(pagamento.id),
      referenciaExterna,
      emailPagador,
      status: pagamento.status === 'approved' ? 'autorizada' : 'pendente',
      ambiente: ambiente.MERCADO_PAGO_AMBIENTE,
      criadaPorUsuarioId: req.sessao!.usuarioId,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    })
    if (pagamento.status === 'approved') {
      const [criada] = await banco.select().from(assinaturas).where(eq(assinaturas.id, id)).limit(1)
      if (criada) await liberarPlanoDaAssinatura(criada, { pix: true })
    }
    res.status(201).json({
      dado: {
        id,
        status: pagamento.status === 'approved' ? 'approved' : 'pending',
        pagamentoId: String(pagamento.id),
        qrCode: pix.qrCode,
        qrCodeBase64: pix.qrCodeBase64,
        ticketUrl: pix.ticketUrl,
      },
    })
  },
)

assinaturasRotas.post('/admin/reconciliar', exigirAdmin, async (_req, res) => {
  const resultado = await reconciliarAssinaturasVencidas()
  res.json({
    mensagem: `Reconciliacao concluida. ${resultado.revogadas} assinatura(s) revogada(s).`,
    dado: resultado,
  })
})

assinaturasRotas.post('/:id/cancelar', exigirFuncao('administrador'), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const [assinatura] = await banco
    .select()
    .from(assinaturas)
    .where(and(eq(assinaturas.id, id), eq(assinaturas.workspaceId, req.sessao!.workspaceId)))
    .limit(1)
  if (!assinatura) throw new ErroHttp(404, 'Assinatura não encontrada.', 'assinatura_nao_encontrada')
  if (!['autorizada', 'pausada'].includes(assinatura.status))
    throw new ErroHttp(422, 'Esta assinatura não pode ser cancelada.', 'assinatura_nao_cancelavel')

  if (!assinaturaEhPix(assinatura) && assinatura.mercadoPagoAssinaturaId) {
    try {
      await cancelarAssinaturaMercadoPago(assinatura.mercadoPagoAssinaturaId)
    } catch {
      /* carencia local mesmo se MP falhar */
    }
  }
  await iniciarCarenciaAssinatura(assinatura, 'cancelamento_usuario')
  const [atualizada] = await banco.select().from(assinaturas).where(eq(assinaturas.id, id)).limit(1)
  res.json({
    mensagem:
      'Cancelamento iniciado. Você mantém o plano atual por 7 dias e depois volta ao gratuito.',
    dado: {
      id,
      status: atualizada?.status ?? 'pausada',
      carenciaAte: atualizada?.carenciaAte ?? null,
    },
  })
})

assinaturasRotas.get('/:id/status', exigirFuncao('administrador'), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const [assinatura] = await banco
    .select()
    .from(assinaturas)
    .where(
      and(eq(assinaturas.id, id), eq(assinaturas.workspaceId, req.sessao!.workspaceId)),
    )
    .limit(1)
  if (!assinatura) throw new ErroHttp(404, 'Assinatura não encontrada.', 'assinatura_nao_encontrada')

  if (assinatura.status === 'pendente' && assinatura.mercadoPagoAssinaturaId && assinaturaEhPix(assinatura)) {
    try {
      const pagamento = await obterPagamentoMercadoPago(assinatura.mercadoPagoAssinaturaId)
      if (pagamento.status === 'approved') {
        await liberarPlanoDaAssinatura(assinatura, { pix: true })
        const [plano] = await banco
          .select()
          .from(planosAssinatura)
          .where(eq(planosAssinatura.id, assinatura.planoAssinaturaId))
          .limit(1)
        const [fresca] = await banco
          .select()
          .from(assinaturas)
          .where(eq(assinaturas.id, id))
          .limit(1)
        res.json({
          dado: {
            id: assinatura.id,
            status: 'autorizada',
            codigoPlano: plano?.codigo ?? null,
            vigenciaAte: fresca?.vigenciaAte ?? null,
            carenciaAte: null,
          },
        })
        return
      }
    } catch {
      // Mantem pendente se a consulta ao MP falhar; o webhook ainda pode concluir.
    }
  }

  const [plano] = await banco
    .select({ codigo: planosAssinatura.codigo })
    .from(planosAssinatura)
    .where(eq(planosAssinatura.id, assinatura.planoAssinaturaId))
    .limit(1)
  const [fresca] = await banco.select().from(assinaturas).where(eq(assinaturas.id, id)).limit(1)
  res.json({
    dado: {
      id: assinatura.id,
      status: fresca?.status ?? assinatura.status,
      codigoPlano: plano?.codigo ?? null,
      carenciaAte: fresca?.carenciaAte ?? null,
      vigenciaAte: fresca?.vigenciaAte ?? null,
    },
  })
})

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
    if (!plano) throw new ErroHttp(404, 'Plano não encontrado.', 'plano_nao_encontrado')
    await banco
      .update(planosAssinatura)
      .set({
        nome: req.body.nome,
        descricao: req.body.descricao,
        valorMensal: String(req.body.valorMensal),
        ativo: req.body.ativo,
        beneficios: req.body.beneficios,
        maxProjetosAtivos: req.body.maxProjetosAtivos,
        maxMembros: req.body.maxMembros,
        maxClientes: req.body.maxClientes,
        maxArmazenamentoGb: req.body.maxArmazenamentoGb,
        maxWorkspaces: req.body.maxWorkspaces,
        permiteIdentidadePersonalizada: req.body.permiteIdentidadePersonalizada,
        permiteCalendarioEditorial: req.body.permiteCalendarioEditorial,
        permiteRelatorios: req.body.permiteRelatorios,
        permiteComentariosImagem: req.body.permiteComentariosImagem,
        permiteComentariosVideo: req.body.permiteComentariosVideo,
        permiteComentariosPdf: req.body.permiteComentariosPdf,
        permiteLinksPortalCliente: req.body.permiteLinksPortalCliente,
        permiteVariosAprovadores: req.body.permiteVariosAprovadores,
        permiteHistoricoAvancado: req.body.permiteHistoricoAvancado,
        permitePrioridadeSuporte: req.body.permitePrioridadeSuporte,
        permiteFuncoesAvancadas: req.body.permiteFuncoesAvancadas,
        atualizadoPorUsuarioId: req.sessao!.usuarioId,
        atualizadoEm: new Date(),
      })
      .where(eq(planosAssinatura.id, plano.id))

    const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
    if (problemaIntegracao || req.body.valorMensal <= 0) {
      res.json({
        mensagem:
          problemaIntegracao && req.body.valorMensal > 0
            ? 'Plano atualizado. Configure o Mercado Pago para sincronizar a cobrança.'
            : 'Plano atualizado.',
      })
      return
    }

    const [planoAtualizado] = await banco
      .select()
      .from(planosAssinatura)
      .where(eq(planosAssinatura.id, plano.id))
      .limit(1)
    if (!planoAtualizado)
      throw new ErroHttp(404, 'Plano não encontrado.', 'plano_nao_encontrado')
    await sincronizarPlanoComMercadoPago(planoAtualizado, req.sessao!.usuarioId)
    res.json({ mensagem: 'Plano atualizado e sincronizado com o Mercado Pago.' })
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
  if (!plano) throw new ErroHttp(404, 'Plano não encontrado.', 'plano_nao_encontrado')
  if (Number(plano.valorMensal) <= 0)
    throw new ErroHttp(
      400,
      'Planos gratuitos não são publicados no Mercado Pago.',
      'plano_gratuito_sem_sincronizacao',
    )
  await sincronizarPlanoComMercadoPago(plano, req.sessao!.usuarioId)
  res.json({ mensagem: 'Plano sincronizado com o Mercado Pago.' })
})
