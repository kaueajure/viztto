import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  arquivos,
  clientes,
  materiais,
  projetos,
  versoesMaterial,
  workspaces,
} from '../../banco/esquema/index.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
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

export const portalRotas = Router()

async function projetoPortal(projetoId: string) {
  const [linha] = await banco
    .select({
      id: projetos.id,
      nome: projetos.nome,
      descricao: projetos.descricao,
      status: projetos.status,
      tipo: projetos.tipo,
      prazoEm: projetos.prazoEm,
      senhaAcessoHash: projetos.senhaAcessoHash,
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

portalRotas.get('/projetos/:projetoId', async (req, res) => {
  const projeto = await projetoPortal(String(req.params.projetoId))
  const liberado = validarAcessoPortal(req.cookies?.[COOKIE_PORTAL], projeto.id)
  res.json({
    dado: {
      id: projeto.id,
      nome: projeto.nome,
      empresaNome: projeto.empresaNome,
      clienteNome: projeto.clienteNome,
      liberado,
      temSenha: Boolean(projeto.senhaAcessoHash),
    },
  })
})

portalRotas.post(
  '/projetos/:projetoId/entrar',
  validarCorpo(entrada),
  async (req, res) => {
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
  },
)

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
      imagemUrl: arquivos.caminhoRelativo,
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
      materiais: lista,
    },
  })
})
