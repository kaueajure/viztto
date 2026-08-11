import { and, eq, isNull, sql } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { contatosCliente, projetos } from '../banco/esquema/index.js'
import { ErroHttp } from '../middlewares/erros.js'

export type AcaoContatoPortal = 'comentar' | 'solicitar_alteracoes' | 'aprovar'

export function normalizarEmailContato(email: string) {
  return email.trim().toLowerCase()
}

export async function listarContatosDoCliente(clienteId: string, workspaceId: string) {
  return banco
    .select()
    .from(contatosCliente)
    .where(
      and(
        eq(contatosCliente.clienteId, clienteId),
        eq(contatosCliente.workspaceId, workspaceId),
        isNull(contatosCliente.excluidoEm),
      ),
    )
    .orderBy(contatosCliente.nome)
}

export async function obterContatoPorEmail(
  clienteId: string,
  email: string,
  workspaceId?: string,
) {
  const emailNorm = normalizarEmailContato(email)
  const filtros = [
    eq(contatosCliente.clienteId, clienteId),
    sql`lower(${contatosCliente.email}) = ${emailNorm}`,
    isNull(contatosCliente.excluidoEm),
  ]
  if (workspaceId) filtros.push(eq(contatosCliente.workspaceId, workspaceId))
  const [contato] = await banco
    .select()
    .from(contatosCliente)
    .where(and(...filtros))
    .limit(1)
  return contato ?? null
}

export async function garantirContatoPortal(opts: {
  projetoId: string
  nome: string
  email: string
  acao: AcaoContatoPortal
}) {
  const nome = opts.nome.trim()
  const email = normalizarEmailContato(opts.email)
  if (!nome || nome.length < 2)
    throw new ErroHttp(400, 'Informe seu nome.', 'contato_nome_obrigatorio')
  if (!email || !email.includes('@'))
    throw new ErroHttp(400, 'Informe um email valido.', 'contato_email_invalido')

  const [projeto] = await banco
    .select({
      id: projetos.id,
      clienteId: projetos.clienteId,
      workspaceId: projetos.workspaceId,
    })
    .from(projetos)
    .where(and(eq(projetos.id, opts.projetoId), isNull(projetos.excluidoEm)))
    .limit(1)
  if (!projeto) throw new ErroHttp(404, 'Projeto nao encontrado.', 'projeto_nao_encontrado')

  const contato = await obterContatoPorEmail(projeto.clienteId, email, projeto.workspaceId)
  if (!contato)
    throw new ErroHttp(
      403,
      'Este email nao esta cadastrado como contato deste cliente.',
      'contato_nao_autorizado',
    )

  if (opts.acao === 'comentar' && !contato.podeComentar)
    throw new ErroHttp(403, 'Seu contato nao tem permissao para comentar.', 'contato_sem_permissao')
  if (opts.acao === 'solicitar_alteracoes' && !contato.podeSolicitarAlteracoes)
    throw new ErroHttp(
      403,
      'Seu contato nao tem permissao para solicitar alteracoes.',
      'contato_sem_permissao',
    )
  if (opts.acao === 'aprovar' && !contato.podeAprovar)
    throw new ErroHttp(403, 'Seu contato nao tem permissao para aprovar.', 'contato_sem_permissao')

  return {
    projeto,
    contato: {
      ...contato,
      nome: contato.nome,
      email: normalizarEmailContato(contato.email),
    },
  }
}
