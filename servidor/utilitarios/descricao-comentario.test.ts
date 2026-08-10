import { describe, expect, it } from 'vitest'
import {
  descricaoComentarioAtividade,
  formatarTimestampVideo,
} from './descricao-comentario.js'

describe('formatarTimestampVideo', () => {
  it('formata segundos curtos e longos', () => {
    expect(formatarTimestampVideo(18)).toBe('0:18')
    expect(formatarTimestampVideo(125)).toBe('2:05')
    expect(formatarTimestampVideo(3739)).toBe('1:02:19')
  })
})

describe('descricaoComentarioAtividade', () => {
  it('descreve comentario de video com timestamp', () => {
    expect(
      descricaoComentarioAtividade({
        autorNome: 'Pedro',
        tipoMaterial: 'video',
        timestampSegundos: 18,
      }),
    ).toBe('Pedro comentou no vídeo em 0:18.')
  })

  it('descreve comentario de PDF com pagina', () => {
    expect(
      descricaoComentarioAtividade({
        autorNome: 'Maria',
        tipoMaterial: 'pdf',
        paginaPdf: 4,
      }),
    ).toBe('Maria comentou na página 4 do PDF.')
  })

  it('descreve comentario de imagem sem coordenadas', () => {
    expect(
      descricaoComentarioAtividade({
        autorNome: 'João',
        tipoMaterial: 'imagem',
      }),
    ).toBe('João comentou na imagem.')
  })
})
