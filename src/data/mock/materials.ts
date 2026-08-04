import type { Material, MaterialVersion } from '@/types/domain'

export const demoMaterials: Material[] = [
  ['material-carousel', 'project-august', 'Carrossel principal', 'image', 'changes', 4, 3],
  [
    'material-presentation',
    'project-rebrand',
    'Apresentação institucional',
    'presentation',
    'waiting',
    3,
    7,
  ],
  ['material-video', 'project-video', 'Vídeo institucional', 'video', 'approved', 4, 0],
  ['material-catalog', 'project-collection', 'Catálogo da coleção', 'pdf', 'waiting', 2, 2],
  ['material-landing', 'project-landing', 'Página principal', 'web', 'changes', 3, 5],
].map(([id, projectId, name, type, status, currentVersion, commentCount]) => ({
  id: String(id),
  projectId: String(projectId),
  name: String(name),
  type: type as Material['type'],
  status: status as Material['status'],
  currentVersion: Number(currentVersion),
  commentCount: Number(commentCount),
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-08-03T14:00:00.000Z',
}))

export const demoVersions: MaterialVersion[] = [1, 2, 3, 4].map((number) => ({
  id: `version-carousel-${number}`,
  materialId: 'material-carousel',
  number,
  label: number === 4 ? 'Versão atual' : `Ajuste ${number}`,
  createdBy: number % 2 ? 'Marina' : 'Rafael',
  createdAt: `2026-08-0${number}T10:00:00.000Z`,
  approved: false,
}))
