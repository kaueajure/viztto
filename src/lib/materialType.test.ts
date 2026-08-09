import { describe, expect, it } from 'vitest'
import {
  materialTypeLabel,
  normalizeMaterialType,
  toApiMaterialType,
} from '../lib/materialType'
import { formatVideoTimestamp } from '../lib/formatVideoTimestamp'

describe('normalizeMaterialType', () => {
  it('aceita apenas image, video e pdf como formatos oficiais', () => {
    expect(normalizeMaterialType('image')).toBe('image')
    expect(normalizeMaterialType('imagem')).toBe('image')
    expect(normalizeMaterialType('video')).toBe('video')
    expect(normalizeMaterialType('pdf')).toBe('pdf')
  })

  it('converte formatos legados para pdf sem descartar leitura', () => {
    expect(normalizeMaterialType('presentation')).toBe('pdf')
    expect(normalizeMaterialType('web')).toBe('pdf')
    expect(normalizeMaterialType('apresentacao')).toBe('pdf')
    expect(normalizeMaterialType('pagina_web')).toBe('pdf')
  })

  it('mapeia labels e payload de API', () => {
    expect(materialTypeLabel('video')).toBe('Vídeo')
    expect(toApiMaterialType('image')).toBe('imagem')
    expect(toApiMaterialType('pdf')).toBe('pdf')
  })
})

describe('formatVideoTimestamp', () => {
  it('formata mm:ss e hh:mm:ss', () => {
    expect(formatVideoTimestamp(13.42)).toBe('0:13')
    expect(formatVideoTimestamp(84)).toBe('1:24')
    expect(formatVideoTimestamp(3739)).toBe('1:02:19')
  })

  it('tolera ausência de timestamp em comentários antigos', () => {
    expect(formatVideoTimestamp(undefined)).toBe('')
    expect(formatVideoTimestamp(null)).toBe('')
  })
})
