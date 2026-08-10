import { describe, expect, it } from 'vitest'
import {
  countAguardandoCliente,
  getPendingApproverIds,
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

  it('marca precisa de mim apenas se o usuario ainda nao aprovou', () => {
    const material = baseMaterial('waiting-approval', {
      approvedApproverIds: ['user-pedro'],
    })
    const project = baseProject({
      approverIds: ['user-pedro', 'user-maria'],
      approvers: ['Pedro', 'Maria'],
    })
    expect(isPrecisaDeMim({ material, project, userId: 'user-pedro' })).toBe(false)
    expect(isPrecisaDeMim({ material, project, userId: 'user-maria' })).toBe(true)
    expect(isAguardandoCliente({ material, project })).toBe(false)
  })

  it('classifica waiting-approval sem aprovadores internos como cliente', () => {
    const material = baseMaterial('waiting-approval')
    const project = baseProject({ approverIds: [] })
    expect(getReviewWaitingContext({ material, project })).toBe('aguardando_cliente')
    expect(isAguardandoCliente({ material, project })).toBe(true)
  })

  it('classifica in-review como aguardando cliente', () => {
    const material = baseMaterial('in-review')
    const project = baseProject({ memberIds: ['user-pedro'], approverIds: [] })
    expect(getReviewWaitingContext({ material, project, userId: 'user-pedro' })).toBe(
      'aguardando_cliente',
    )
    expect(isAguardandoCliente({ material, project })).toBe(true)
  })

  it('alteracoes solicitadas para o responsavel caem em precisa de mim', () => {
    const material = baseMaterial('changes-requested')
    const project = baseProject({ memberIds: ['user-pedro'], approverIds: ['user-maria'] })
    expect(isPrecisaDeMim({ material, project, userId: 'user-pedro' })).toBe(true)
  })
})

describe('getPendingApproverIds e labelAguardandoAcao', () => {
  it('exibe o aprovador pendente correto apos Pedro aprovar', () => {
    const material = baseMaterial('waiting-approval', {
      approvedApproverIds: ['user-pedro'],
    })
    const project = baseProject({
      approverIds: ['user-pedro', 'user-maria'],
      approvers: ['Pedro', 'Maria'],
      approvalMode: 'all',
    })
    expect(getPendingApproverIds(project, material.approvedApproverIds)).toEqual(['user-maria'])
    expect(
      labelAguardandoAcao({ material, project }, ['Maria']),
    ).toBe('Aguardando confirmação de Maria')
  })

  it('exibe contagem quando ha multiplos pendentes', () => {
    const material = baseMaterial('waiting-approval', {
      approvedApproverIds: ['user-pedro'],
    })
    const project = baseProject({
      approverIds: ['user-pedro', 'user-maria', 'user-carlos'],
      approvers: ['Pedro', 'Maria', 'Carlos'],
      approvalMode: 'all',
    })
    expect(getPendingApproverIds(project, material.approvedApproverIds)).toEqual([
      'user-maria',
      'user-carlos',
    ])
    expect(
      labelAguardandoAcao({ material, project }, ['Maria', 'Carlos']),
    ).toBe('Aguardando 2 confirmações internas')
  })
})

describe('countAguardandoCliente', () => {
  it('conta apenas materiais cuja proxima acao e do cliente', () => {
    const projectCliente = baseProject({
      id: 'p-cliente',
      clientId: 'c1',
      approverIds: [],
    })
    const projectInterno = baseProject({
      id: 'p-interno',
      clientId: 'c1',
      approverIds: ['user-maria'],
      approvers: ['Maria'],
    })
    const materials = [
      baseMaterial('waiting-approval', { id: 'a', projectId: 'p-cliente' }),
      baseMaterial('waiting-approval', { id: 'b', projectId: 'p-interno' }),
      baseMaterial('approved', { id: 'c', projectId: 'p-cliente' }),
      baseMaterial('changes-requested', { id: 'd', projectId: 'p-interno' }),
      baseMaterial('waiting-approval', { id: 'e', projectId: 'p-cliente' }),
      baseMaterial('in-review', { id: 'f', projectId: 'p-cliente' }),
    ]
    const byId = (id: string) =>
      id === 'p-cliente' ? projectCliente : id === 'p-interno' ? projectInterno : undefined

    expect(countAguardandoCliente(materials, byId)).toBe(3)
    expect(
      isAguardandoCliente({
        material: materials[1],
        project: projectInterno,
      }),
    ).toBe(false)
  })
})
