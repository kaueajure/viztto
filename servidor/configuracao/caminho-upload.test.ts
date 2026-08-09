import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolverDiretorioUploads } from './caminho-upload.js'

describe('resolverDiretorioUploads', () => {
  const raiz = path.resolve('home', 'usuario', 'domains', 'viztto.site', 'nodejs')
  const pastaDominio = path.dirname(raiz)

  it('resolve um nome relativo como pasta irma da raiz implantada em producao', () => {
    expect(resolverDiretorioUploads(raiz, 'DIRETORIO_UPLOADS', true)).toBe(
      path.join(pastaDominio, 'DIRETORIO_UPLOADS'),
    )
  })

  it('mantem compatibilidade com ../uploads', () => {
    expect(resolverDiretorioUploads(raiz, path.join('..', 'uploads'), true)).toBe(
      path.join(pastaDominio, 'uploads'),
    )
  })

  it('preserva caminhos absolutos', () => {
    const absoluto = path.resolve('armazenamento', 'viztto')
    expect(resolverDiretorioUploads(raiz, absoluto, true)).toBe(absoluto)
  })

  it('continua usando a raiz do projeto em desenvolvimento', () => {
    expect(resolverDiretorioUploads(raiz, './uploads', false)).toBe(path.join(raiz, 'uploads'))
  })
})
