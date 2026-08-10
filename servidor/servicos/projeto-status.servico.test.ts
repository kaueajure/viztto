import { describe, expect, it } from 'vitest'
import { agregarStatusProjetoPorMateriais, progressoProjeto } from './projeto-status.servico.js'

describe('agregarStatusProjetoPorMateriais', () => {
  it('nao aprova o projeto se ainda houver materiais pendentes', () => {
    expect(
      agregarStatusProjetoPorMateriais([
        'aprovado',
        'em_revisao',
        'alteracoes_solicitadas',
        'aguardando_aprovacao',
      ]),
    ).toBe('alteracoes_solicitadas')
  })

  it('prioriza em_revisao antes de aguardando_aprovacao', () => {
    expect(agregarStatusProjetoPorMateriais(['aprovado', 'em_revisao', 'aguardando_aprovacao'])).toBe(
      'em_revisao',
    )
  })

  it('marca aprovado apenas quando todos estao aprovados', () => {
    expect(agregarStatusProjetoPorMateriais(['aprovado', 'aprovado'])).toBe('aprovado')
  })

  it('retorna null sem materiais', () => {
    expect(agregarStatusProjetoPorMateriais([])).toBeNull()
  })
})

describe('progressoProjeto', () => {
  it('calcula percentual real', () => {
    expect(progressoProjeto(8, 10)).toEqual({
      progress: 80,
      approvedMaterialCount: 8,
      materialCount: 10,
    })
  })

  it('retorna zero sem materiais', () => {
    expect(progressoProjeto(0, 0)).toEqual({
      progress: 0,
      approvedMaterialCount: 0,
      materialCount: 0,
    })
  })
})
