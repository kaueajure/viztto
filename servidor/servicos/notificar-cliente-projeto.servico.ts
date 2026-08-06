import { and, eq, isNull } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { clientes, projetos, workspaces } from '../banco/esquema/index.js'
import { enviarEmailProjetoAlterado, enviarEmailProjetoCriado } from './email.servico.js'
import { linkPortalProjeto } from './projeto-acesso.servico.js'

type DestinoCliente = {
  email: string
  clienteNome: string
  projetoId: string
  projetoNome: string
  empresaNome: string
}

async function destinoDoProjeto(
  projetoId: string,
  workspaceId: string,
): Promise<DestinoCliente | null> {
  const [linha] = await banco
    .select({
      projetoId: projetos.id,
      projetoNome: projetos.nome,
      clienteNome: clientes.nome,
      email: clientes.email,
      empresaNome: workspaces.nome,
    })
    .from(projetos)
    .innerJoin(clientes, eq(clientes.id, projetos.clienteId))
    .innerJoin(workspaces, eq(workspaces.id, projetos.workspaceId))
    .where(
      and(
        eq(projetos.id, projetoId),
        eq(projetos.workspaceId, workspaceId),
        isNull(projetos.excluidoEm),
        isNull(clientes.excluidoEm),
      ),
    )
    .limit(1)

  const email = linha?.email?.trim()
  if (!linha || !email) return null

  return {
    email,
    clienteNome: linha.clienteNome,
    projetoId: linha.projetoId,
    projetoNome: linha.projetoNome,
    empresaNome: linha.empresaNome,
  }
}

/** Avisa o cliente quando um projeto e criado para ele. */
export async function notificarClienteProjetoCriado(entrada: {
  projetoId: string
  workspaceId: string
  criadorNome: string
  senhaAcesso: string
}) {
  try {
    const destino = await destinoDoProjeto(entrada.projetoId, entrada.workspaceId)
    if (!destino) return
    await enviarEmailProjetoCriado({
      destino: destino.email,
      clienteNome: destino.clienteNome,
      projetoNome: destino.projetoNome,
      criadorNome: entrada.criadorNome.trim() || 'Alguem da equipe',
      empresaNome: destino.empresaNome,
      link: linkPortalProjeto(destino.projetoId),
      senhaAcesso: entrada.senhaAcesso,
    })
  } catch (erro) {
    console.error(
      'Falha ao notificar cliente sobre projeto criado.',
      erro instanceof Error ? erro.message : erro,
    )
  }
}

/** Avisa o cliente quando ha qualquer alteracao relevante no projeto. */
export async function notificarClienteProjetoAlterado(entrada: {
  projetoId: string
  workspaceId: string
  resumo: string
}) {
  try {
    const destino = await destinoDoProjeto(entrada.projetoId, entrada.workspaceId)
    if (!destino) return
    await enviarEmailProjetoAlterado({
      destino: destino.email,
      clienteNome: destino.clienteNome,
      projetoNome: destino.projetoNome,
      empresaNome: destino.empresaNome,
      resumo: entrada.resumo,
      link: linkPortalProjeto(destino.projetoId),
    })
  } catch (erro) {
    console.error(
      'Falha ao notificar cliente sobre alteracao de projeto.',
      erro instanceof Error ? erro.message : erro,
    )
  }
}
