import { Router } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import {
  clientes,
  projetos,
  workspaces,
  type PortalConfiguracaoDados,
} from '../../banco/esquema/index.js'
import { banco } from '../../configuracao/banco.js'
import { receberImagemPortal } from '../../configuracao/upload.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { armazenarAssetPortal, removerArquivoSalvo } from '../../servicos/arquivo.servico.js'
import { garantirPortalPersonalizado } from '../../servicos/limites-plano.servico.js'
import {
  camposAssetPortal,
  carregarContextoPortal,
  configuracaoPortalEntrada,
  type EscopoPortal,
  urlAssetPortal,
} from '../../servicos/portal-personalizacao.servico.js'
import { gerarHashSenhaAcesso, gerarTokenPortal } from '../../servicos/projeto-acesso.servico.js'

const parametros = z.object({
  escopo: z.enum(['workspace', 'cliente', 'projeto']),
  id: z.string().uuid(),
})
const parametrosAsset = parametros.extend({ campo: z.enum(camposAssetPortal) })
const atualizacao = z.object({
  herdar: z.boolean().optional(),
  configuracao: configuracaoPortalEntrada.optional(),
  senha: z.union([z.string().min(4).max(80), z.null()]).optional(),
  expiraEm: z.union([z.null(), z.coerce.date()]).optional(),
})

export const portalConfiguracoesRotas = Router()
portalConfiguracoesRotas.use(exigirFuncao('atendimento'))
portalConfiguracoesRotas.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store')
  next()
})

function garantirPermissaoEscopo(escopo: EscopoPortal, sessao: { funcao: string; admin: boolean }) {
  if (
    escopo === 'workspace' &&
    !sessao.admin &&
    !['gestor', 'administrador'].includes(sessao.funcao)
  )
    throw new ErroHttp(403, 'Voce nao possui permissao para esta acao.', 'sem_permissao')
}

async function alvo(escopo: EscopoPortal, id: string, workspaceId: string) {
  if (escopo === 'workspace') {
    if (id !== workspaceId)
      throw new ErroHttp(404, 'Workspace nao encontrado.', 'workspace_nao_encontrado')
    const [linha] = await banco
      .select({ id: workspaces.id, config: workspaces.portalConfiguracao })
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.excluidoEm)))
      .limit(1)
    return linha ? { ...linha, clienteId: null, expiraEm: null, protegido: false } : null
  }
  if (escopo === 'cliente') {
    const [linha] = await banco
      .select({ id: clientes.id, config: clientes.portalConfiguracao })
      .from(clientes)
      .where(
        and(
          eq(clientes.id, id),
          eq(clientes.workspaceId, workspaceId),
          isNull(clientes.excluidoEm),
        ),
      )
      .limit(1)
    return linha ? { ...linha, clienteId: linha.id, expiraEm: null, protegido: false } : null
  }
  const [linha] = await banco
    .select({
      id: projetos.id,
      clienteId: projetos.clienteId,
      config: projetos.portalConfiguracao,
      expiraEm: projetos.portalExpiraEm,
      senhaHash: projetos.senhaAcessoHash,
    })
    .from(projetos)
    .where(
      and(eq(projetos.id, id), eq(projetos.workspaceId, workspaceId), isNull(projetos.excluidoEm)),
    )
    .limit(1)
  return linha ? { ...linha, protegido: Boolean(linha.senhaHash) } : null
}

async function atualizarConfig(
  escopo: EscopoPortal,
  id: string,
  workspaceId: string,
  config: PortalConfiguracaoDados | null,
) {
  const valores = { portalConfiguracao: config, atualizadoEm: new Date() }
  if (escopo === 'workspace') {
    await banco
      .update(workspaces)
      .set({
        ...valores,
        ...(config?.corPrincipal ? { corPrincipal: config.corPrincipal } : {}),
      })
      .where(eq(workspaces.id, workspaceId))
  } else if (escopo === 'cliente') {
    await banco
      .update(clientes)
      .set(valores)
      .where(and(eq(clientes.id, id), eq(clientes.workspaceId, workspaceId)))
  } else {
    await banco
      .update(projetos)
      .set(valores)
      .where(and(eq(projetos.id, id), eq(projetos.workspaceId, workspaceId)))
  }
}

portalConfiguracoesRotas.get('/:escopo/:id', async (req, res) => {
  const { escopo, id } = parametros.parse(req.params)
  garantirPermissaoEscopo(escopo, req.sessao!)
  const workspaceId = req.sessao!.workspaceId
  await garantirPortalPersonalizado(workspaceId)
  const entidade = await alvo(escopo, id, workspaceId)
  if (!entidade) throw new ErroHttp(404, 'Registro nao encontrado.', 'registro_nao_encontrado')
  const contexto = await carregarContextoPortal({
    workspaceId,
    clienteId: entidade.clienteId,
    projetoId: escopo === 'projeto' ? id : null,
  })
  res.json({
    dado: {
      configuracao: contexto.configuracao,
      configuracaoPropria: entidade.config,
      herdando: escopo !== 'workspace' && entidade.config == null,
      protegido: entidade.protegido,
      expiraEm: entidade.expiraEm,
    },
  })
})

portalConfiguracoesRotas.patch('/:escopo/:id', validarCorpo(atualizacao), async (req, res) => {
  const { escopo, id } = parametros.parse(req.params)
  garantirPermissaoEscopo(escopo, req.sessao!)
  const workspaceId = req.sessao!.workspaceId
  await garantirPortalPersonalizado(workspaceId)
  const entidade = await alvo(escopo, id, workspaceId)
  if (!entidade) throw new ErroHttp(404, 'Registro nao encontrado.', 'registro_nao_encontrado')
  if (escopo !== 'projeto' && (req.body.senha !== undefined || req.body.expiraEm !== undefined))
    throw new ErroHttp(422, 'Seguranca so pode ser configurada por projeto.', 'dados_invalidos')
  if (req.body.expiraEm instanceof Date && req.body.expiraEm.getTime() <= Date.now())
    throw new ErroHttp(
      422,
      'A data de expiracao precisa estar no futuro.',
      'portal_expiracao_invalida',
    )

  if (req.body.herdar) await atualizarConfig(escopo, id, workspaceId, null)
  else if (req.body.configuracao) {
    const assets = Object.fromEntries(
      camposAssetPortal
        .filter((campo) => entidade.config?.[campo] !== undefined)
        .map((campo) => [campo, entidade.config?.[campo]]),
    )
    await atualizarConfig(escopo, id, workspaceId, { ...req.body.configuracao, ...assets })
  }

  if (escopo === 'projeto' && (req.body.senha !== undefined || req.body.expiraEm !== undefined)) {
    await banco
      .update(projetos)
      .set({
        ...(req.body.senha !== undefined
          ? {
              senhaAcessoHash: req.body.senha ? await gerarHashSenhaAcesso(req.body.senha) : null,
              tokenPortal: gerarTokenPortal(),
            }
          : {}),
        ...(req.body.expiraEm !== undefined ? { portalExpiraEm: req.body.expiraEm } : {}),
        atualizadoEm: new Date(),
      })
      .where(and(eq(projetos.id, id), eq(projetos.workspaceId, workspaceId)))
  }
  const atualizado = await alvo(escopo, id, workspaceId)
  res.json({
    mensagem: 'Personalizacao do portal atualizada.',
    dado: atualizado
      ? {
          protegido: atualizado.protegido,
          expiraEm: atualizado.expiraEm,
          linkAlterado: escopo === 'projeto' && req.body.senha !== undefined,
        }
      : null,
  })
})

portalConfiguracoesRotas.post(
  '/:escopo/:id/assets/:campo',
  receberImagemPortal,
  async (req, res) => {
    const { escopo, id, campo } = parametrosAsset.parse(req.params)
    garantirPermissaoEscopo(escopo, req.sessao!)
    const workspaceId = req.sessao!.workspaceId
    await garantirPortalPersonalizado(workspaceId)
    const entidade = await alvo(escopo, id, workspaceId)
    if (!entidade) throw new ErroHttp(404, 'Registro nao encontrado.', 'registro_nao_encontrado')
    if (!req.file) throw new ErroHttp(422, 'Selecione uma imagem.', 'arquivo_ausente')
    const salvo = await armazenarAssetPortal(req.file.buffer, workspaceId, escopo, id, campo)
    const config = { ...(entidade.config ?? {}), [campo]: salvo.caminhoRelativo }
    try {
      await atualizarConfig(escopo, id, workspaceId, config)
    } catch (erro) {
      await removerArquivoSalvo(salvo.caminhoRelativo)
      throw erro
    }
    const anterior = entidade.config?.[campo]
    if (anterior) await removerArquivoSalvo(anterior).catch(() => undefined)
    res.json({
      mensagem: 'Imagem atualizada.',
      dado: { url: urlAssetPortal(escopo, id, campo, salvo.caminhoRelativo) },
    })
  },
)

portalConfiguracoesRotas.delete('/:escopo/:id/assets/:campo', async (req, res) => {
  const { escopo, id, campo } = parametrosAsset.parse(req.params)
  garantirPermissaoEscopo(escopo, req.sessao!)
  const workspaceId = req.sessao!.workspaceId
  await garantirPortalPersonalizado(workspaceId)
  const entidade = await alvo(escopo, id, workspaceId)
  if (!entidade) throw new ErroHttp(404, 'Registro nao encontrado.', 'registro_nao_encontrado')
  const anterior = entidade.config?.[campo]
  await atualizarConfig(escopo, id, workspaceId, { ...(entidade.config ?? {}), [campo]: null })
  if (anterior) await removerArquivoSalvo(anterior).catch(() => undefined)
  res.json({ mensagem: 'Imagem removida.', dado: { url: null } })
})
