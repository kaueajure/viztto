import type { Client } from '@/types/domain'

export const demoClients: Client[] = [
  ['client-lume', 'Lume Cosméticos', 'Lume', 2, 2, '#b8ff4f'],
  ['client-norte', 'Norte Arquitetura', 'Norte', 1, 0, '#7c8cff'],
  ['client-origem', 'Origem Café', 'Origem', 2, 1, '#ff6b57'],
  ['client-metabit', 'Metabit', 'Metabit Tecnologia', 1, 0, '#7cffb2'],
].map(([id, name, company, projectCount, pendingApprovals, color]) => ({
  id: String(id),
  workspaceId: 'workspace-aurora',
  name: String(name),
  company: String(company),
  email: `contato@${String(company).toLowerCase().replace(/\s/g, '')}.exemplo`,
  status: 'active' as const,
  projectCount: Number(projectCount),
  pendingApprovals: Number(pendingApprovals),
  color: String(color),
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-08-03T13:20:00.000Z',
}))
