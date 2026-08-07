import path from 'node:path'
import { Router } from 'express'
import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { diretorioUploads } from '../../configuracao/upload.js'
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
import {
  carregarMarcaPortal,
} from '../../servicos/limites-plano.servico.js'
import {
  COOKIE_PORTAL,
  assinarAcessoPortal,
  opcoesCookiePortal,
  senhaAcessoConfere,
  validarAcessoPortal,
} from '../../servicos/projeto-acesso.servico.js'

const entrada = z.object({
  senha: z.string().trim().min(4).max(64),
})
const novoComentarioPortal = z.object({
  texto: z.string().trim().min(1).max(5000),
  posicaoX: z.number().min(0).max(1),
  posicaoY: z.number().min(0).max(1),
})
const decisaoPortal = z.object({
  confirmarPendencias: z.boolean().optional(),
})

export const portalRotas = Router()

const autorNomeSql = sql<string>`coalesce(${comentarios.autorExternoNome}, ${usuarios.nome}, 'Cliente')`.as(
  'autorNome',
)

async function projetoPortal(projetoId: string) {
  const [linha] = await banco
    .select({
      id: projetos.id,
      workspaceId: projetos.workspaceId,
      nome: projetos.nome,
      descricao: projetos.descricao,
      status: projetos.status,
      tipo: projetos.tipo,
      prazoEm: projetos.prazoEm,
      senhaAcessoHash: projetos.senhaAcessoHash,
      criadoPorUsuarioId: projetos.criadoPorUsuarioId,
      empresaNome: workspaces.nome,
      clienteNome: clientes.nome,
    })
    .from(projetos)
    .innerJoin(workspaces, eq(workspaces.id, projetos.workspaceId))
    .innerJoin(clientes, eq(clientes.id, projetos.clienteId))
    .where(and(eq(projetos.id, projetoId), isNull(projetos.excluidoEm)))
    .limit(1)
  if (!linha) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')
  return linha
}

function exigirCookiePortal(req: { cookies?: Record<string, string> }, projetoId: string) {
  const token = req.cookies?.[COOKIE_PORTAL]
  if (!validarAcessoPortal(token, projetoId))
    throw new ErroHttp(401, 'Informe a senha de acesso deste projeto.', 'portal_nao_autorizado')
}

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
  if (!material) throw new ErroHttp(404, 'Material nao encontrado.', 'material_nao_encontrado')
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
  const projeto = await projetoPortal(String(req.params.projetoId))
  const liberado = validarAcessoPortal(req.cookies?.[COOKIE_PORTAL], projeto.id)
  const marca = await carregarMarcaPortal(projeto.workspaceId)
  res.json({
    dado: {
      id: projeto.id,
      nome: projeto.nome,
      empresaNome: marca.empresaNome,
      clienteNome: projeto.clienteNome,
      liberado,
      temSenha: Boolean(projeto.senhaAcessoHash),
      marca: {
        corPrincipal: marca.corPrincipal,
        logoUrl: marca.logoUrl,
        whiteLabel: marca.whiteLabel,
      },
    },
  })
})

portalRotas.post('/projetos/:projetoId/entrar', validarCorpo(entrada), async (req, res) => {
  const projeto = await projetoPortal(String(req.params.projetoId))
  if (!projeto.senhaAcessoHash)
    throw new ErroHttp(
      422,
      'Este projeto ainda nao possui senha de acesso. Peça uma nova ao responsavel.',
      'senha_ausente',
    )
  if (!(await senhaAcessoConfere(req.body.senha, projeto.senhaAcessoHash)))
    throw new ErroHttp(401, 'Senha de acesso incorreta.', 'senha_incorreta')
  res
    .cookie(COOKIE_PORTAL, assinarAcessoPortal(projeto.id), opcoesCookiePortal())
    .json({ mensagem: 'Acesso liberado.' })
})

portalRotas.post('/projetos/:projetoId/sair', async (req, res) => {
  res.clearCookie(COOKIE_PORTAL, { path: '/' }).status(204).end()
})

portalRotas.get('/projetos/:projetoId/conteudo', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  exigirCookiePortal(req, projetoId)
  const projeto = await projetoPortal(projetoId)
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
  exigirCookiePortal(req, projetoId)
  const projeto = await projetoPortal(projetoId)
  const material = await materialDoProjeto(String(req.params.materialId), projetoId)
  if (!material.versaoAtualId)
    throw new ErroHttp(422, 'Este material ainda nao tem versao para revisar.', 'versao_ausente')
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
  if (!versao) throw new ErroHttp(404, 'Versao nao encontrada.', 'versao_nao_encontrada')
  res.json({
    dado: {
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        empresaNome: projeto.empresaNome,
        clienteNome: projeto.clienteNome,
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
    },
  })
})

portalRotas.get('/projetos/:projetoId/arquivos/:arquivoId', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  exigirCookiePortal(req, projetoId)
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
  if (!arquivo) throw new ErroHttp(404, 'Arquivo nao encontrado.', 'arquivo_nao_encontrado')
  const absoluto = path.resolve(diretorioUploads, ...arquivo.caminhoRelativo.split('/'))
  if (!absoluto.startsWith(`${diretorioUploads}${path.sep}`))
    throw new ErroHttp(400, 'Caminho de arquivo invalido.', 'arquivo_invalido')
  res.type(arquivo.mimeType).setHeader('Cache-Control', 'private, max-age=3600').sendFile(absoluto)
})

portalRotas.get('/projetos/:projetoId/materiais/:materialId/comentarios', async (req, res) => {
  const projetoId = String(req.params.projetoId)
  exigirCookiePortal(req, projetoId)
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
    exigirCookiePortal(req, projetoId)
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versao antes de comentar.', 'versao_ausente')
    if (material.status === 'aprovado')
      throw new ErroHttp(
        409,
        'Este material ja foi aprovado. Aguarde uma nova versao da equipe.',
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
    exigirCookiePortal(req, projetoId)
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versao antes desta acao.', 'versao_ausente')
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
    exigirCookiePortal(req, projetoId)
    const projeto = await projetoPortal(projetoId)
    const material = await materialDoProjeto(String(req.params.materialId), projetoId)
    if (!material.versaoAtualId)
      throw new ErroHttp(422, 'Publique uma versao antes desta acao.', 'versao_ausente')
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
        'Esta versao possui comentarios pendentes. Confirme para aprovar.',
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
      titulo: 'Cliente aprovou a versao',
      descricao: `${projeto.clienteNome} aprovou "${material.nome}".`,
      tipo: 'versao_aprovada',
    })
    res.status(201).json({ dado: { id } })
  },
)
