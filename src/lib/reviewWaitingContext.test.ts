import { describe, expect, it } from 'vitest'
import {
  countAguardandoCliente,
  getReviewWaitingContext,
  isAguardandoCliente,
  isPrecisaDeMim,
  labelAguardandoAcao,
} from './reviewWaitingContext'
import type { Material, Project } from '@/types/domain'

const baseMaterial = (
  status: Material['status'],
  overrides: Partial<Material> = {},
): Material => ({
  id: 'm1',
  projectId: 'p1',
  name: 'Banner',
  type: 'image',
  status,
  currentVersion: 1,
  currentVersionId: 'v1',
  commentCount: 0,
  unresolvedCommentCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  clientId: 'c1',
  name: 'Campanha',
  type: 'Campanha',
  status: 'in-review',
  progress: 0,
  materialCount: 1,
  approvedMaterialCount: 0,
  pendingClientCount: 0,
  commentCount: 0,
  members: [],
  memberIds: [],
  approvers: [],
  approverIds: [],
  approvalMode: 'any',
  portalActive: true,
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('getReviewWaitingContext', () => {
  it('trata waiting-approval legado como aguardando cliente', () => {
    const material = baseMaterial('waiting-approval')
    const project = baseProject({ memberIds: ['user-pedro'] })
    expect(getReviewWaitingContext({ material, project })).toBe('aguardando_cliente')
    expect(isAguardandoCliente({ material, project })).toBe(true)
  })

  it('classifica in-review como aguardando cliente', () => {
    const material = baseMaterial('in-review')
    const project = baseProject({ memberIds: ['user-pedro'] })
    expect(getReviewWaitingContext({ material, project, userId: 'user-pedro' })).toBe(
      'aguardando_cliente',
    )
  })

  it('alteracoes solicitadas para o responsavel caem em precisa de mim', () => {
    const material = baseMaterial('changes-requested')
    const project = baseProject({ memberIds: ['user-pedro'] })
    expect(isPrecisaDeMim({ material, project, userId: 'user-pedro' })).toBe(true)
  })
})

describe('labelAguardandoAcao', () => {
  it('rotula status do cliente', () => {
    expect(labelAguardandoAcao({ material: baseMaterial('in-review') })).toBe(
      'Aguardando revisão do cliente',
    )
    expect(labelAguardandoAcao({ material: baseMaterial('changes-requested') })).toBe(
      'Cliente solicitou alterações',
    )
  })
})

describe('countAguardandoCliente', () => {
  it('conta materiais aguardando o Cliente 2', () => {
    const project = baseProject()
    const materials = [
      baseMaterial('waiting-approval', { id: 'a' }),
      baseMaterial('in-review', { id: 'b' }),
      baseMaterial('approved', { id: 'c' }),
      baseMaterial('changes-requested', { id: 'd' }),
      baseMaterial('draft', { id: 'e' }),
    ]
    expect(countAguardandoCliente(materials, () => project)).toBe(2)
  })
})
