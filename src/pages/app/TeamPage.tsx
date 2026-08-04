import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { Avatar, Badge } from '@/components/ui/DataDisplay'
import { Input, Select } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'
import { useAppData } from '@/contexts/AppDataContext'
import type { TeamMember } from '@/types/domain'

export default function TeamPage() {
  const { team, addTeamMember } = useAppData()
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<{ name: string; email: string; role: TeamMember['role'] }>({
    name: '',
    email: '',
    role: 'Criativo',
  })
  const invite = () => {
    if (!form.name || !form.email) return
    addTeamMember(form)
    setSuccess(true)
    window.setTimeout(() => {
      setOpen(false)
      setSuccess(false)
      setForm({ name: '', email: '', role: 'Criativo' })
    }, 550)
  }
  return (
    <div>
      <PageHeader title="Equipe" description="Membros, funções e acessos simulados do workspace." />
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" /> Convidar membro
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="hidden bg-surface-secondary text-xs text-muted md:table-header-group">
            <tr>
              <th className="p-4">Membro</th>
              <th className="p-4">Função</th>
              <th className="p-4">Projetos</th>
              <th className="p-4">Status</th>
              <th className="p-4">Último acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.map((member) => (
              <tr className="block p-4 md:table-row md:p-0" key={member.id}>
                <td className="flex items-center gap-3 md:p-4">
                  <Avatar name={member.name} />
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                </td>
                <td className="mt-3 inline-block md:mt-0 md:table-cell md:p-4">{member.role}</td>
                <td className="ml-5 inline-block md:ml-0 md:table-cell md:p-4">
                  {member.projectCount}
                </td>
                <td className="mt-3 block md:mt-0 md:table-cell md:p-4">
                  <Badge tone={member.status === 'active' ? 'approval' : 'warning'}>
                    {member.status === 'active' ? 'Ativo' : 'Convidado'}
                  </Badge>
                </td>
                <td className="mt-2 block text-muted md:mt-0 md:table-cell md:p-4">
                  {member.lastAccess}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Convidar membro">
        <div className="grid gap-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select
            label="Função"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as TeamMember['role'] })}
          >
            {['Administrador', 'Gestor', 'Criativo', 'Atendimento', 'Cliente', 'Visualizador'].map(
              (role) => (
                <option key={role}>{role}</option>
              ),
            )}
          </Select>
          {success && (
            <p role="status" className="text-sm text-approval">
              Convite adicionado localmente.
            </p>
          )}
          <Button onClick={invite}>Enviar convite simulado</Button>
        </div>
      </Modal>
    </div>
  )
}
