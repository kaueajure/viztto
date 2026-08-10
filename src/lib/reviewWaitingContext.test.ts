import { describe, expect, it } from 'vitest'
import {
  getReviewWaitingContext,
  isAguardandoCliente,
  isPrecisaDeMim,
} from './reviewWaitingContext'
import type { Material, Project } from '@/types/domain'

const baseMaterial = (status: Material['status']): Material => ({
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
})

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  clientId: 'c1',
  name: 'Campanha',
  type: 'Campanha',
  status: 'waiting-approval',
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
  it('nao classifica waiting-approval com aprovador interno como cliente', () => {
    const material = baseMaterial('waiting-approval')
    const project = baseProject({
      approverIds: ['user-maria'],
      memberIds: ['user-pedro'],
    })
    expect(
      getReviewWaitingContext({ material, project, userId: 'user-outro' }),
    ).toBe('aguardando_aprovador_interno')
    expect(isAguardandoCliente({ material, project, userId: 'user-outro' })).toBe(false)
  })

  it('marca precisa de mim quando o usuario atual e aprovador pendente', () => {
    const material = baseMaterial('waiting-approval')
    const project = baseProject({ approverIds: ['user-maria'] })
    expect(isPrecisaDeMim({ material, project, userId: 'user-maria' })).toBe(true)
    expect(isAguardandoCliente({ material, project, userId: 'user-maria' })).toBe(false)
  })

  it('classifica waiting-approval sem aprovadores internos como cliente', () => {
    const material = baseMaterial('waiting-approval')
    const project = baseProject({ approverIds: [] })
    expect(getReviewWaitingContext({ material, project })).toBe('aguardando_cliente')
    expect(isAguardandoCliente({ material, project })).toBe(true)
  })

  it('alteracoes solicitadas para o responsavel caem em precisa de mim', () => {
    const material = baseMaterial('changes-requested')
    const project = baseProject({ memberIds: ['user-pedro'], approverIds: ['user-maria'] })
    expect(isPrecisaDeMim({ material, project, userId: 'user-pedro' })).toBe(true)
  })
})
