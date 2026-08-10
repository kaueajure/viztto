import { describe, expect, it } from 'vitest'
import {
  acaoAprovacaoAtividade,
  acaoComentarioAtividade,
  descricaoAprovacaoNotificacao,
  descricaoComentarioNotificacao,
  formatarTimestampVideo,
} from './descricao-comentario.js'

describe('formatarTimestampVideo', () => {
  it('formata segundos curtos e longos', () => {
    expect(formatarTimestampVideo(18)).toBe('0:18')
    expect(formatarTimestampVideo(65)).toBe('1:05')
    expect(formatarTimestampVideo(125)).toBe('2:05')
    expect(formatarTimestampVideo(3661)).toBe('1:01:01')
  })
})

describe('acaoComentarioAtividade', () => {
  it('nao inclui o nome do ator', () => {
    expect(
      acaoComentarioAtividade({
        tipoMaterial: 'video',
        timestampSegundos: 18,
      }),
    ).toBe('comentou no vídeo em 0:18.')
  })

  it('descreve comentario de PDF com pagina', () => {
    expect(
      acaoComentarioAtividade({
        tipoMaterial: 'pdf',
        paginaPdf: 4,
      }),
    ).toBe('comentou na página 4 do PDF.')
  })

  it('descreve comentario de imagem sem coordenadas', () => {
    expect(acaoComentarioAtividade({ tipoMaterial: 'imagem' })).toBe('comentou na imagem.')
  })
})

describe('descricaoComentarioNotificacao', () => {
  it('monta frase completa com o ator', () => {
    expect(
      descricaoComentarioNotificacao({
        autorNome: 'Pedro',
        tipoMaterial: 'video',
        timestampSegundos: 18,
      }),
    ).toBe('Pedro comentou no vídeo em 0:18.')
  })
})

describe('acaoAprovacaoAtividade', () => {
  it('parcial nao inclui nome', () => {
    expect(
      acaoAprovacaoAtividade({
        numeroVersao: 4,
        materialFinalizado: false,
        faltam: 1,
      }),
    ).toBe('aprovou V4. Aguardando 1 aprovação.')
  })

  it('final nao inclui nome', () => {
    expect(
      acaoAprovacaoAtividade({
        numeroVersao: 4,
        materialFinalizado: true,
      }),
    ).toBe('aprovou V4.')
  })
})

describe('descricaoAprovacaoNotificacao', () => {
  it('parcial e final com frase completa', () => {
    expect(
      descricaoAprovacaoNotificacao({
        autorNome: 'Pedro',
        numeroVersao: 4,
        materialFinalizado: false,
        faltam: 1,
      }),
    ).toBe('Pedro aprovou V4. Ainda falta 1 aprovação.')
    expect(
      descricaoAprovacaoNotificacao({
        autorNome: 'Maria',
        numeroVersao: 4,
        materialFinalizado: true,
      }),
    ).toBe('Maria aprovou V4. Todas as aprovações foram concluídas.')
  })
})
