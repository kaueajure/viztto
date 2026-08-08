import { Router } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import { arquivos } from '../../banco/esquema/index.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { enviarArquivoResposta } from '../../servicos/arquivo.servico.js'

export const arquivosRotas = Router()
arquivosRotas.get('/:arquivoId', async (req, res) => {
  const [arquivo] = await banco
    .select()
    .from(arquivos)
    .where(
      and(
        eq(arquivos.id, String(req.params.arquivoId)),
        eq(arquivos.workspaceId, req.sessao!.workspaceId),
        isNull(arquivos.excluidoEm),
      ),
    )
    .limit(1)
  if (!arquivo) throw new ErroHttp(404, 'Arquivo nao encontrado.', 'arquivo_nao_encontrado')
  await enviarArquivoResposta(res, arquivo.caminhoRelativo, arquivo.mimeType)
})
