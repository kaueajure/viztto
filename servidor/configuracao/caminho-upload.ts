import path from 'node:path'

/**
 * Em producao, nomes relativos simples ficam ao lado da raiz implantada.
 * Assim, uma raiz /dominio/nodejs e o valor "uploads" resultam em
 * /dominio/uploads, que sobrevive aos redeploys da aplicacao.
 */
export function resolverDiretorioUploads(
  raizProjeto: string,
  caminhoConfigurado: string | undefined,
  emProducao: boolean,
) {
  const configurado = caminhoConfigurado?.trim()

  if (!configurado)
    return path.resolve(emProducao ? path.dirname(raizProjeto) : raizProjeto, 'uploads')
  if (path.isAbsolute(configurado)) return path.normalize(configurado)
  if (!emProducao) return path.resolve(raizProjeto, configurado)

  // Mantem compatibilidade com a configuracao historica ../uploads.
  if (configurado === '..' || configurado.startsWith(`..${path.sep}`))
    return path.resolve(raizProjeto, configurado)

  return path.resolve(path.dirname(raizProjeto), configurado)
}
