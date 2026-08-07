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

const codigoPlano = z.enum(['freelancer', 'studio', 'agency'])
const limiteOpcional = z.number().int().positive().max(1_000_000).nullable()
const atualizarEntrada = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().min(2).max(300),
  valorMensal: z.number().positive().max(100_000),
  ativo: z.boolean(),
  beneficios: z.array(z.string().trim().min(1).max(200)).max(40),
  maxProjetosAtivos: limiteOpcional,
  maxMembros: limiteOpcional,
  maxClientes: limiteOpcional,
  maxArmazenamentoGb: limiteOpcional,
  maxWorkspaces: limiteOpcional,
  permiteIdentidadePersonalizada: z.boolean(),
  permitePortalWhiteLabel: z.boolean(),
  permiteCalendarioEditorial: z.boolean(),
  permiteRelatorios: z.boolean(),
})
const criarAssinaturaEntrada = z.object({
  codigoPlano,
  tokenCartao: z.string().trim().min(20).max(300),
  emailPagador: z.string().email(),
})
const criarCheckoutEntrada = z.object({
  codigoPlano,
  emailPagador: z.string().email(),
})
const criarPixEntrada = z.object({
  codigoPlano,
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
      diagnosticarConfiguracaoMercadoPago() ?? 'Pagador de teste nao configurado.',
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
  const dado = await obterUsoELimitesDoWorkspace(req.sessao!.workspaceId)
  res.json({ dado })
})

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
    if (remoto.status === 'authorized')
      await banco
        .update(workspaces)
        .set({ plano: plano.codigo, atualizadoEm: new Date() })
        .where(eq(workspaces.id, req.sessao!.workspaceId))
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
        'O Mercado Pago nao retornou o link de checkout da assinatura.',
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
        'O Mercado Pago nao retornou o QR Code Pix. Confirme se a chave Pix esta ativa na conta.',
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
    if (pagamento.status === 'approved')
      await banco
        .update(workspaces)
        .set({ plano: plano.codigo, atualizadoEm: new Date() })
        .where(eq(workspaces.id, req.sessao!.workspaceId))
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

assinaturasRotas.get('/:id/status', exigirFuncao('administrador'), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const [assinatura] = await banco
    .select()
    .from(assinaturas)
    .where(
      and(eq(assinaturas.id, id), eq(assinaturas.workspaceId, req.sessao!.workspaceId)),
    )
    .limit(1)
  if (!assinatura) throw new ErroHttp(404, 'Assinatura nao encontrada.', 'assinatura_nao_encontrada')

  if (assinatura.status === 'pendente' && assinatura.mercadoPagoAssinaturaId) {
    try {
      const pagamento = await obterPagamentoMercadoPago(assinatura.mercadoPagoAssinaturaId)
      if (pagamento.status === 'approved') {
        await banco
          .update(assinaturas)
          .set({ status: 'autorizada', atualizadoEm: new Date() })
          .where(eq(assinaturas.id, assinatura.id))
        const [plano] = await banco
          .select()
          .from(planosAssinatura)
          .where(eq(planosAssinatura.id, assinatura.planoAssinaturaId))
          .limit(1)
        if (plano)
          await banco
            .update(workspaces)
            .set({ plano: plano.codigo, atualizadoEm: new Date() })
            .where(eq(workspaces.id, assinatura.workspaceId))
        res.json({
          dado: { id: assinatura.id, status: 'autorizada', codigoPlano: plano?.codigo ?? null },
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
  res.json({
    dado: {
      id: assinatura.id,
      status: assinatura.status,
      codigoPlano: plano?.codigo ?? null,
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
    if (!plano) throw new ErroHttp(404, 'Plano nao encontrado.', 'plano_nao_encontrado')
    const precoAnterior = Number(plano.valorMensal)
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
        permitePortalWhiteLabel: req.body.permitePortalWhiteLabel,
        permiteCalendarioEditorial: req.body.permiteCalendarioEditorial,
        permiteRelatorios: req.body.permiteRelatorios,
        atualizadoPorUsuarioId: req.sessao!.usuarioId,
        atualizadoEm: new Date(),
      })
      .where(eq(planosAssinatura.id, plano.id))

    const precoMudou = precoAnterior !== req.body.valorMensal
    const problemaIntegracao = diagnosticarConfiguracaoMercadoPago()
    if (!precoMudou || problemaIntegracao) {
      res.json({
        mensagem: problemaIntegracao
          ? 'Plano atualizado. Configure o Mercado Pago para sincronizar o preço na cobrança.'
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
      throw new ErroHttp(404, 'Plano nao encontrado.', 'plano_nao_encontrado')
    await sincronizarPlanoComMercadoPago(planoAtualizado, req.sessao!.usuarioId)
    res.json({ mensagem: 'Plano atualizado e preço sincronizado com o Mercado Pago.' })
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
  await sincronizarPlanoComMercadoPago(plano, req.sessao!.usuarioId)
  res.json({ mensagem: 'Plano sincronizado com o Mercado Pago.' })
})
