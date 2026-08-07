import { Router } from 'express'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import {
  convitesWorkspace,
  membrosWorkspace,
  usuarios,
  workspaces,
} from '../../banco/esquema/index.js'
import { exigirFuncao } from '../../middlewares/autorizacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { enviarEmailConviteWorkspace } from '../../servicos/email.servico.js'
import { garantirPodeConvidarMembro } from '../../servicos/limites-plano.servico.js'
import { gerarHash, normalizarEmail, novoId, novoToken } from '../../utilitarios/seguranca.js'

const novoConvite = z.object({
  email: z.string().email(),
  funcao: z.enum(['administrador', 'gestor', 'criativo', 'atendimento', 'visualizador']),
})

export const equipeRotas = Router()

equipeRotas.post(
  '/convites',
  exigirFuncao('gestor'),
  validarCorpo(novoConvite),
  async (req, res) => {
    const email = normalizarEmail(req.body.email)
    const workspaceId = req.sessao!.workspaceId
    const agora = new Date()
    const [workspace] = await banco
      .select({ nome: workspaces.nome })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)
    const [membroExistente] = await banco
      .select({ id: membrosWorkspace.id })
      .from(membrosWorkspace)
      .innerJoin(usuarios, eq(usuarios.id, membrosWorkspace.usuarioId))
      .where(
        and(
          eq(membrosWorkspace.workspaceId, workspaceId),
          eq(usuarios.email, email),
          eq(membrosWorkspace.status, 'ativo'),
        ),
      )
      .limit(1)
    if (membroExistente)
      throw new ErroHttp(409, 'Este usuario ja faz parte da equipe.', 'membro_existente')

    await garantirPodeConvidarMembro(workspaceId)

    const token = novoToken()
    const envio = await enviarEmailConviteWorkspace({
      destino: email,
      nomeConvidador: req.sessao!.usuarioNome,
      workspaceNome: workspace?.nome ?? 'seu workspace',
      funcao: req.body.funcao,
      token,
    })

    await banco.transaction(async (tx) => {
      await tx
        .update(convitesWorkspace)
        .set({ canceladoEm: agora })
        .where(
          and(
            eq(convitesWorkspace.workspaceId, workspaceId),
            eq(convitesWorkspace.email, email),
            isNull(convitesWorkspace.aceitoEm),
            isNull(convitesWorkspace.canceladoEm),
          ),
        )
      await tx.insert(convitesWorkspace).values({
        id: novoId(),
        workspaceId,
        email,
        funcao: req.body.funcao,
        tokenHash: gerarHash(token),
        convidadoPorUsuarioId: req.sessao!.usuarioId,
        expiraEm: new Date(agora.getTime() + 7 * 24 * 60 * 60_000),
        criadoEm: agora,
      })
    })
    res.status(201).json({
      mensagem: 'Convite enviado.',
      ...(!envio.enviado ? { tokenConvite: token } : {}),
    })
  },
)

equipeRotas.get('/convites', async (req, res) => {
  const dados = await banco
    .select({
      id: convitesWorkspace.id,
      email: convitesWorkspace.email,
      funcao: convitesWorkspace.funcao,
      criadoEm: convitesWorkspace.criadoEm,
      expiraEm: convitesWorkspace.expiraEm,
    })
    .from(convitesWorkspace)
    .where(
      and(
        eq(convitesWorkspace.workspaceId, req.sessao!.workspaceId),
        isNull(convitesWorkspace.aceitoEm),
        isNull(convitesWorkspace.canceladoEm),
        gt(convitesWorkspace.expiraEm, new Date()),
      ),
    )
  res.json({ dados })
})
