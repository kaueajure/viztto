import { describe, expect, it } from 'vitest'
import {
  garantirTransicaoMaterial,
  materialVisivelNoPortal,
  statusDestinoWorkflow,
} from './material-workflow.servico.js'
import { ErroHttp } from '../middlewares/erros.js'

describe('material-workflow', () => {
  it('permite enviar rascunho e rejeita aprovacao direta', () => {
    expect(garantirTransicaoMaterial('rascunho', 'enviar_para_aprovacao')).toBe('aguardando_revisao')
    expect(() => garantirTransicaoMaterial('rascunho', 'aprovar')).toThrow(ErroHttp)
    expect(() => garantirTransicaoMaterial('alteracoes_solicitadas', 'aprovar')).toThrow(ErroHttp)
  })

  it('oculta rascunhos do portal', () => {
    expect(materialVisivelNoPortal('rascunho')).toBe(false)
    expect(materialVisivelNoPortal('aguardando_revisao')).toBe(true)
  })

  it('nova versao volta para rascunho', () => {
    expect(statusDestinoWorkflow('criar_nova_versao')).toBe('rascunho')
  })
})
