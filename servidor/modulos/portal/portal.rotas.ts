import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  aprovacoes,
  arquivos,
  atividades,
  clientes,
  comentarios,
  materiais,
  notificacoes,
  projetos,
  usuarios,
  versoesMaterial,
  workspaces,
} from '../../banco/esquema/index.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { novoId } from '../../utilitarios/seguranca.js'
import { enviarArquivoResposta } from '../../servicos/arquivo.servico.js'
import {
  carregarMarcaPortal,
  garantirComentarioNoMaterial,
  garantirLinksPortalCliente,
  garantirPortalPersonalizado,
} from '../../servicos/limites-plano.servico.js'
import {
  assinarAcessoPortal,
  cookiePortalProjeto,
  opcoesCookiePortal,
  senhaAcessoConfere,
  tokenPortalConfere,
  validarAcessoPortal,
} from '../../servicos/projeto-acesso.servico.js'
import {
  camposAssetPortal,
  obterAssetPortal,
} from '../../servicos/portal-personalizacao.servico.js'

const novoComentarioPortal = z.object({
  texto: z.string().trim().min(1).max(5000),
  posicaoX: z.number().min(0).max(1),
  posicaoY: z.number().min(0).max(1),
})
const decisaoPortal = z.object({
  confirmarPendencias: z.boolean().optional(),
})
const desbloqueioPortal = z.object({ senha: z.string().min(1).max(80) })
const tentativasDesbloqueio = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

export const portalRotas = Router()
portalRotas.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store')
  next()
})

const autorNomeSql =
  sql<string>`coalesce(${comentarios.autorExternoNome}, ${usuarios.nome}, 'Cliente')`.as(
    'autorNome',
  )

async function projetoPortal(projetoId: string, workspaceSlug?: string) {
  const [linha] = await banco
    .select({
      id: projetos.id,
      workspaceId: projetos.workspaceId,
      nome: projetos.nome,
      descricao: projetos.descricao,
      status: projetos.status,
      tipo: projetos.tipo,
      prazoEm: projetos.prazoEm,
      tokenPortal: projetos.tokenPortal,
      senhaAcessoHash: projetos.senhaAcessoHash,
      portalExpiraEm: projetos.portalExpiraEm,
      clienteId: projetos.clienteId,
      criadoPorUsuarioId: projetos.criadoPorUsuarioId,
      empresaNome: workspaces.nome,
      workspaceSlug: workspaces.slug,
      clienteNome: clientes.nome,
    })
    .from(projetos)
    .innerJoin(workspaces, eq(workspaces.id, projetos.workspaceId))
    .innerJoin(clientes, eq(clientes.id, projetos.clienteId))
    .where(and(eq(projetos.id, projetoId), isNull(projetos.excluidoEm)))
    .limit(1)
  if (!linha) throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  if (workspaceSlug && linha.workspaceSlug !== workspaceSlug)
    throw new ErroHttp(404, 'Projeto não encontrado.', 'projeto_nao_encontrado')
  return linha
}

function tokenDaRequisicao(req: {
  query: Record<string, unknown>
  headers: { [key: string]: unknown }
}) {
  const query = req.query.t
  if (typeof query === 'string' && query.trim()) return query.trim()
  const header = req.headers['x-portal-token']
  if (typeof header === 'string' && header.trim()) return header.trim()
  return undefined
}

function cookieDaRequisicao(req: { cookies?: Record<string, string> }, projetoId: string) {
  return req.cookies?.[cookiePortalProjeto(projetoId)]
}

/** Acesso ao portal exige o token do link compartilhado (?t=...). */
async function exigirAcessoPortal(
  projetoId: string,
  tokenRecebido: string | undefined,
  workspaceSlug?: string,
  cookieRecebido?: string,
) {
  const projeto = await projetoPortal(projetoId, workspaceSlug)
  await garantirLinksPortalCliente(projeto.workspaceId)
  if (!tokenPortalConfere(tokenRecebido, projeto.tokenPortal))
    throw new ErroHttp(
      401,
      'Link de acesso inválido ou incompleto. Peça um novo link à equipe.',
      'portal_token_invalido',
    )
  if (projeto.portalExpiraEm && projeto.portalExpiraEm.getTime() <= Date.now())
    throw new ErroHttp(410, 'Este link de portal expirou.', 'portal_expirado')
  if (
    projeto.senhaAcessoHash &&
    !validarAcessoPortal(cookieRecebido, projeto.id, projeto.tokenPortal ?? '')
  )
    throw new ErroHttp(
      401,
      'Digite a senha deste portal para continuar.',
      'portal_senha_necessaria',
    )
  return projeto
}

portalRotas.post(
  '/projetos/:projetoId/desbloquear',
  tentativasDesbloqueio,
  validarCorpo(desbloqueioPortal),
  async (req, res) => {
    const projetoId = String(req.params.projetoId)
    const projeto = await projetoPortal(projetoId)
    await garantirLinksPortalCliente(projeto.workspaceId)
    if (!tokenPortalConfere(tokenDaRequisicao(req), projeto.tokenPortal))
      throw new ErroHttp(401, 'Link de acesso inválido.', 'portal_token_invalido')
    if (projeto.portalExpiraEm && projeto.portalExpiraEm.getTime() <= Date.now())
      throw new ErroHttp(410, 'Este link de portal expirou.', 'portal_expirado')
    if (
      !projeto.senhaAcessoHash ||
      !(await senhaAcessoConfere(req.body.senha, projeto.senhaAcessoHash))
    )
      throw new ErroHttp(401, 'Senha incorreta.', 'portal_senha_incorreta')
    res.cookie(
      cookiePortalProjeto(projeto.id),
      assinarAcessoPortal(projeto.id, projeto.tokenPortal ?? ''),
      opcoesCookiePortal(),
    )
    res.json({ mensagem: 'Portal desbloqueado.' })
  },
)

portalRotas.get('/personalizacao-assets/:escopo/:id/:campo', async (req, res) => {
  const escopo = z.enum(['workspace', 'cliente', 'projeto']).parse(req.params.escopo)
  const campo = z.enum(camposAssetPortal).parse(req.params.campo)
  const asset = await obterAssetPortal(escopo, String(req.params.id), campo)
  if (!asset?.caminho) throw new ErroHttp(404, 'Imagem não encontrada.', 'arquivo_nao_encontrado')
  await garantirPortalPersonalizado(asset.workspaceId)
  const ext = asset.caminho.toLowerCase().split('.').pop()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  await enviarArquivoResposta(res, asset.caminho, mime)
})

async function materialDoProjeto(materialId: string, projetoId: string) {
  const [material] = await banco
    .select()
    .from(materiais)
    .where(
      and(
        eq(materiais.id, materialId),
        eq(materiais.projetoId, projetoId),
        isNull(materiais.excluidoEm),
      ),
    )
    .limit(1)
  if (!material) throw new ErroHttp(404, 'Material não encontrado.', 'material_nao_encontrado')
  return material
}

async function notificarEquipe(entrada: {
  workspaceId: string
  destinatarioId: string | null
  atividadeId: string
  titulo: string
  descricao: string
  tipo: string
}) {
  if (!entrada.destinatarioId) return
  await banco.insert(notificacoes).values({
    id: novoId(),
    workspaceId: entrada.workspaceId,
    usuarioId: entrada.destinatarioId,
    atividadeId: entrada.atividadeId,
    titulo: entrada.titulo,
    descricao: entrada.descricao,
    tipo: entrada.tipo,
    criadoEm: new Date(),
  })
}

portalRotas.get('/projetos/:projetoId', async (req, res) => {
  const slugQuery = typeof req.query.slug === 'string' ? req.query.slug : undefined
  const projeto = await exigirAcessoPortal(
    String(req.params.projetoId),
    tokenDaRequisicao(req),
    slugQuery,
    cookieDaRequisicao(req, String(req.params.projetoId)),
  )
  const marca = await carregarMarcaPortal(projeto.workspaceId, projeto.clienteId, projeto.id)
  res.json({
    dado: {
      id: projeto.id,
      nome: projeto.nome,
      empresaNome: marca.empresaNome,
      clienteNome: projeto.clienteNome,
      workspaceSlug: projeto.workspaceSlug,
      liberado: true,
      marca,
    },
  })
})

portalRotas.get('/workspaces/:workspaceId/logo', async (req, res) => {
  const workspaceId = String(req.params.workspaceId)
  const marca = await carregarMarcaPortal(workspaceId)
  if (!marca.logoUrl) throw new ErroHttp(404, 'Logo não encontrado.', 'logo_nao_encontrado')
  const [workspace] = await banco
    .select({ logoUrl: workspaces.logoUrl })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.excluidoEm)))
    .limit(1)
  if (!workspace?.logoUrl) throw new ErroHttp(404, 'Logo não encontrado.', 'logo_nao_encontrado')
  const ext = workspace.logoUrl.toLowerCase().split('.').pop()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  await enviarArquivoResposta(res, workspace.logoUrl, mime)
})

portalRotas.get('/projetos/:projetoId/conteudo', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  const projeto = await exigirAcessoPortal(
    projetoId,
    tokenDaRequisicao(req),
    undefined,
    cookieDaRequisicao(req, projetoId),
  )
  const lista = await banco
    .select({
      id: materiais.id,
      nome: materiais.nome,
      tipo: materiais.tipo,
      status: materiais.status,
      versaoAtual: versoesMaterial.numero,
      arquivoId: arquivos.id,
      atualizadoEm: materiais.atualizadoEm,
    })
    .from(materiais)
    .leftJoin(versoesMaterial, eq(versoesMaterial.id, materiais.versaoAtualId))
    .leftJoin(arquivos, eq(arquivos.id, versoesMaterial.arquivoId))
    .where(and(eq(materiais.projetoId, projetoId), isNull(materiais.excluidoEm)))
    .orderBy(desc(materiais.atualizadoEm))

  res.json({
    dado: {
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        status: projeto.status,
        tipo: projeto.tipo,
        prazoEm: projeto.prazoEm,
        empresaNome: projeto.empresaNome,
        clienteNome: projeto.clienteNome,
      },
      marca: await carregarMarcaPortal(projeto.workspaceId, projeto.clienteId, projeto.id),
      materiais: lista.map((item) => ({
        ...item,
        imagemUrl: item.arquivoId
          ? `/api/portal/projetos/${projetoId}/arquivos/${item.arquivoId}`
          : null,
      })),
    },
  })
})

portalRotas.get('/projetos/:projetoId/materiais/:materialId', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  const slugQuery = typeof req.query.slug === 'string' ? req.query.slug : undefined
  const projeto = await exigirAcessoPortal(
    projetoId,
    tokenDaRequisicao(req),
    slugQuery,
    cookieDaRequisicao(req, projetoId),
  )
  const material = await materialDoProjeto(String(req.params.materialId), projetoId)
  if (!material.versaoAtualId)
    throw new ErroHttp(422, 'Este material ainda não tem versão para revisar.', 'versao_ausente')
  const [versao] = await banco
    .select({
      id: versoesMaterial.id,
      numero: versoesMaterial.numero,
      nome: versoesMaterial.nome,
      arquivoId: versoesMaterial.arquivoId,
      aprovada: versoesMaterial.aprovada,
    })
    .from(versoesMaterial)
    .where(and(eq(versoesMaterial.id, material.versaoAtualId), isNull(versoesMaterial.excluidoEm)))
    .limit(1)
  if (!versao) throw new ErroHttp(404, 'Versão não encontrada.', 'versao_nao_encontrada')
  const marca = await carregarMarcaPortal(projeto.workspaceId, projeto.clienteId, projeto.id)
  res.json({
    dado: {
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        empresaNome: projeto.empresaNome,
        clienteNome: projeto.clienteNome,
        workspaceSlug: projeto.workspaceSlug,
      },
      material: {
        id: material.id,
        nome: material.nome,
        status: material.status,
        tipo: material.tipo,
      },
      versao: {
        ...versao,
        imagemUrl: `/api/portal/projetos/${projetoId}/arquivos/${versao.arquivoId}`,
      },
      marca,
    },
  })
})

portalRotas.get('/projetos/:projetoId/arquivos/:arquivoId', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  await exigirAcessoPortal(
    projetoId,
    tokenDaRequisicao(req),
    undefined,
    cookieDaRequisicao(req, projetoId),
  )
  const [arquivo] = await banco
    .select({
      id: arquivos.id,
      mimeType: arquivos.mimeType,
      caminhoRelativo: arquivos.caminhoRelativo,
    })
    .from(arquivos)
    .innerJoin(versoesMaterial, eq(versoesMaterial.arquivoId, arquivos.id))
    .innerJoin(materiais, eq(materiais.id, versoesMaterial.materialId))
    .where(
      and(
        eq(arquivos.id, String(req.params.arquivoId)),
        eq(materiais.projetoId, projetoId),
        isNull(arquivos.excluidoEm),
        isNull(materiais.excluidoEm),
      ),
    )
    .limit(1)
  if (!arquivo) throw new ErroHttp(404, 'Arquivo não encontrado.', 'arquivo_nao_encontrado')
  await enviarArquivoResposta(res, arquivo.caminhoRelativo, arquivo.mimeType)
})

portalRotas.get('/projetos/:projetoId/materiais/:materialId/comentarios', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  await exigirAcessoPortal(
    projetoId,
    tokenDaRequisicao(req),
    undefined,
    cookieDaRequisicao(req, projetoId),
  )
  const material = await materialDoProjeto(String(req.params.materialId), projetoId)
  const dados = await banco
    .select({ comentario: comentarios, autorNome: autorNomeSql })
    .from(comentarios)
    .leftJoin(usuarios, eq(usuarios.id, comentarios.usuarioId))
    .where(and(eq(comentarios.materialId, material.id), isNull(comentarios.excluidoEm)))
    .orderBy(asc(comentarios.criadoEm))
  res.json({
    dados: dados.map(({ comentario, autorNome }) => ({
      id: comentario.id,
      materialId: comentario.materialId,
      versionId: comentario.versaoMaterialId,
      authorId: comentario.usuarioId ?? `portal:${comentario.id}`,
      authorName: autorNome,
      text: comentario.texto,
      x: Number(comentario.posicaoX),
      y: Number(comentario.posicaoY),
      status: comentario.status === 'aberto' ? 'open' : 'resolved',
      createdAt: comentario.criadoEm,
      updatedAt: comentario.atualizadoEm,
      externo: Boolean(comentario.autorExternoNome),
    })),
  })
})

portalRotas.post(
  '/projetos/:projetoId/materiais/:materialId/comentarios',
  validarCorpo(novoComentarioPortal),
  async (req, res) => {
    const projetoId = String(req.params.projetoId)
    await exigirAcessoPortal(
      projetoId,
      tokenDaRequisicao(req),
      undefined,
      cookieDaRequisicao(req, projetoId),
    )
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    await garantirComentarioNoMaterial(material.workspaceId, material.tipo)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versão antes de comentar.', 'versao_ausente')
    if (material.status === 'aprovado')
      throw new ErroHttp(
        409,
        'Este material já foi aprovado. Aguarde uma nova versão da equipe.',
        'material_aprovado',
      )
    const id = novoId()
    const atividadeId = novoId()
    const agora = new Date()
    await banco.transaction(async (tx) => {
      await tx.insert(comentarios).values({
        id,
        workspaceId: material.workspaceId,
        materialId: material.id,
        versaoMaterialId: material.versaoAtualId!,
        usuarioId: null,
        autorExternoNome: projeto.clienteNome,
        texto: req.body.texto,
        posicaoX: String(req.body.posicaoX),
        posicaoY: String(req.body.posicaoY),
        status: 'aberto',
        criadoEm: agora,
        atualizadoEm: agora,
      })
      await tx
        .update(materiais)
        .set({ status: 'em_revisao', atualizadoEm: agora })
        .where(eq(materiais.id, material.id))
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: material.workspaceId,
        usuarioId: null,
        projetoId,
        materialId: material.id,
        versaoMaterialId: material.versaoAtualId!,
        comentarioId: id,
        tipo: 'comentario_criado',
        descricao: `${projeto.clienteNome} comentou no material ${material.nome}`,
        criadoEm: agora,
      })
    })
    await notificarEquipe({
      workspaceId: material.workspaceId,
      destinatarioId: projeto.criadoPorUsuarioId,
      atividadeId,
      titulo: 'Novo comentario do cliente',
      descricao: `${projeto.clienteNome} deixou um comentario em "${material.nome}".`,
      tipo: 'comentario_criado',
    })
    res.status(201).json({ dado: { id } })
  },
)

portalRotas.post(
  '/projetos/:projetoId/materiais/:materialId/solicitar-alteracoes',
  async (req, res) => {
    const projetoId = String(req.params.projetoId)
    await exigirAcessoPortal(
      projetoId,
      tokenDaRequisicao(req),
      undefined,
      cookieDaRequisicao(req, projetoId),
    )
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versão antes desta ação.', 'versao_ausente')
    const [abertos] = await banco
      .select({ total: count() })
      .from(comentarios)
      .where(
        and(
          eq(comentarios.versaoMaterialId, material.versaoAtualId),
          eq(comentarios.status, 'aberto'),
          isNull(comentarios.excluidoEm),
        ),
      )
    if (!(abertos?.total ?? 0))
      throw new ErroHttp(
        422,
        'Adicione ao menos um comentario antes de solicitar alteracoes.',
        'sem_pendencias',
      )
    const agora = new Date()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx
        .update(materiais)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(materiais.id, material.id))
      await tx
        .update(projetos)
        .set({ status: 'alteracoes_solicitadas', atualizadoEm: agora })
        .where(eq(projetos.id, projetoId))
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: material.workspaceId,
        usuarioId: null,
        projetoId,
        materialId: material.id,
        versaoMaterialId: material.versaoAtualId!,
        tipo: 'alteracoes_solicitadas',
        descricao: `${projeto.clienteNome} solicitou alteracoes em ${material.nome}`,
        criadoEm: agora,
      })
    })
    await notificarEquipe({
      workspaceId: material.workspaceId,
      destinatarioId: projeto.criadoPorUsuarioId,
      atividadeId,
      titulo: 'Cliente solicitou alteracoes',
      descricao: `${projeto.clienteNome} pediu correcoes em "${material.nome}".`,
      tipo: 'alteracoes_solicitadas',
    })
    res.json({ mensagem: 'Alteracoes solicitadas.' })
  },
)

portalRotas.post(
  '/projetos/:projetoId/materiais/:materialId/aprovar',
  validarCorpo(decisaoPortal),
  async (req, res) => {
    const projetoId = String(req.params.projetoId)
    await exigirAcessoPortal(
      projetoId,
      tokenDaRequisicao(req),
      undefined,
      cookieDaRequisicao(req, projetoId),
    )
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versão antes desta ação.', 'versao_ausente')
    const [abertos] = await banco
      .select({ total: count() })
      .from(comentarios)
      .where(
        and(
          eq(comentarios.versaoMaterialId, material.versaoAtualId),
          eq(comentarios.status, 'aberto'),
          isNull(comentarios.excluidoEm),
        ),
      )
    if ((abertos?.total ?? 0) > 0 && !req.body.confirmarPendencias)
      throw new ErroHttp(
        409,
        'Esta versão possui comentários pendentes. Confirme para aprovar.',
        'pendencias_abertas',
        { total: abertos?.total },
      )
    const agora = new Date()
    const id = novoId()
    const atividadeId = novoId()
    await banco.transaction(async (tx) => {
      await tx.insert(aprovacoes).values({
        id,
        workspaceId: material.workspaceId,
        materialId: material.id,
        versaoMaterialId: material.versaoAtualId!,
        aprovadoPorUsuarioId: null,
        aprovadoPorExternoNome: projeto.clienteNome,
        aprovadoEm: agora,
        criadoEm: agora,
      })
      await tx
        .update(versoesMaterial)
        .set({ aprovada: true })
        .where(eq(versoesMaterial.id, material.versaoAtualId!))
      await tx
        .update(materiais)
        .set({ status: 'aprovado', atualizadoEm: agora })
        .where(eq(materiais.id, material.id))
      await tx
        .update(projetos)
        .set({ status: 'aprovado', atualizadoEm: agora })
        .where(eq(projetos.id, projetoId))
      await tx.insert(atividades).values({
        id: atividadeId,
        workspaceId: material.workspaceId,
        usuarioId: null,
        projetoId,
        materialId: material.id,
        versaoMaterialId: material.versaoAtualId!,
        tipo: 'versao_aprovada',
        descricao: `${projeto.clienteNome} aprovou ${material.nome}`,
        criadoEm: agora,
      })
    })
    await notificarEquipe({
      workspaceId: material.workspaceId,
      destinatarioId: projeto.criadoPorUsuarioId,
      atividadeId,
      titulo: 'Cliente aprovou a versão',
      descricao: `${projeto.clienteNome} aprovou "${material.nome}".`,
      tipo: 'versao_aprovada',
    })
    res.status(201).json({ dado: { id } })
  },
)
