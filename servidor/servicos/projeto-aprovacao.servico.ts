import { and, eq, isNull } from 'drizzle-orm'
import { banco } from '../configuracao/banco.js'
import { participantesProjeto } from '../banco/esquema/index.js'
import { ErroHttp } from '../middlewares/erros.js'

type SessaoAprovacao = {
  usuarioId: string
  funcao: string
  admin?: boolean
}

/**
 * Regras de quem pode aprovar no app autenticado:
 * - admin da plataforma: override
 * - administrador ou gestor do workspace: override
 * - demais funções: precisam estar em participantes_projeto como aprovador
 * - se não houver aprovadores configurados: mantém compatibilidade com atendimento/criativo+
 *   (quem já passou em exigirFuncao('atendimento'))
 */
export async function garantirPodeAprovarProjeto(
  projetoId: string,
  sessao: SessaoAprovacao,
): Promise<{ aprovadores: string[]; override: boolean }> {
  const aprovadores = await banco
    .select({ usuarioId: participantesProjeto.usuarioId })
    .from(participantesProjeto)
    .where(
      and(
        eq(participantesProjeto.projetoId, projetoId),
        eq(participantesProjeto.tipoParticipacao, 'aprovador'),
        isNull(participantesProjeto.removidoEm),
      ),
    )
  const ids = aprovadores.map((item) => item.usuarioId)
  const override =
    Boolean(sessao.admin) || sessao.funcao === 'administrador' || sessao.funcao === 'gestor'

  if (override) return { aprovadores: ids, override: true }

  if (ids.length === 0) return { aprovadores: ids, override: false }

  if (!ids.includes(sessao.usuarioId))
    throw new ErroHttp(
      403,
      'Você não possui permissão para aprovar este projeto.',
      'nao_aprovador',
    )

  return { aprovadores: ids, override: false }
}
