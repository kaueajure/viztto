import path from 'node:path'
import { Router } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import { diretorioUploads } from '../../configuracao/upload.js'
import { arquivos } from '../../banco/esquema/index.js'
import { ErroHttp } from '../../middlewares/erros.js'

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
  const absoluto = path.resolve(diretorioUploads, ...arquivo.caminhoRelativo.split('/'))
  if (!absoluto.startsWith(`${diretorioUploads}${path.sep}`))
    throw new ErroHttp(400, 'Caminho de arquivo invalido.', 'arquivo_invalido')
  res.type(arquivo.mimeType).setHeader('Cache-Control', 'private, max-age=3600').sendFile(absoluto)
})
