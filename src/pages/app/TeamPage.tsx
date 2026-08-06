import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/app/AppUi'
import { Button } from '@/components/ui/Button'
import { Avatar, Badge } from '@/components/ui/DataDisplay'
import { Input, Select } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { requisicaoApi } from '@/services/api/clienteHttp'
import type { TeamMember } from '@/types/domain'

type UsuarioPlataforma = {
  id: string
  nome: string
  email: string
  avatarUrl?: string | null
  admin: boolean
  ativo: boolean
}

export default function TeamPage() {
  const { team, addTeamMember } = useAppData()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioPlataforma[]>([])
  const [form, setForm] = useState<{ email: string; role: TeamMember['role'] }>({
    email: '',
    role: 'Criativo',
  })
  useEffect(() => {
    if (!user?.admin) {
      setUsuarios([])
      return
    }
    let ativo = true
    requisicaoApi<{ dados: UsuarioPlataforma[] }>('/api/usuarios')
      .then(({ dados }) => {
        if (ativo) setUsuarios(dados)
      })
      .catch(() => {
        if (ativo) setUsuarios([])
      })
    return () => {
      ativo = false
    }
  }, [user?.admin])
  const invite = async () => {
    if (!form.email) return
    setSubmitting(true)
    setInviteError('')
    try {
      await addTeamMember(form)
      setSuccess(true)
      window.setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setForm({ email: '', role: 'Criativo' })
      }, 550)
    } catch (erro) {
      setInviteError(erro instanceof Error ? erro.message : 'Não foi possível enviar o convite.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div>
      <PageHeader
        title="Equipe"
        description={
          user?.admin
            ? 'Membros do workspace ativo e visão de todos os usuários da plataforma.'
            : 'Membros, funções e acessos do workspace.'
        }
      />
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
      {user?.admin && usuarios.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold">Todos os usuários</h2>
          <p className="mt-1 text-xs text-muted">
            Visão de plataforma disponível apenas para admin.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="hidden bg-surface-secondary text-xs text-muted md:table-header-group">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usuarios.map((item) => (
                  <tr className="block p-4 md:table-row md:p-0" key={item.id}>
                    <td className="flex items-center gap-3 md:p-4">
                      <Avatar name={item.nome} />
                      <div>
                        <p className="font-semibold">{item.nome}</p>
                        <p className="text-xs text-muted">{item.email}</p>
                      </div>
                    </td>
                    <td className="mt-3 inline-block md:mt-0 md:table-cell md:p-4">
                      {item.admin ? 'Admin' : 'Usuário'}
                    </td>
                    <td className="mt-3 block md:mt-0 md:table-cell md:p-4">
                      <Badge tone={item.ativo ? 'approval' : 'warning'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Convidar membro">
        <div className="grid gap-4">
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
            {['Administrador', 'Gestor', 'Criativo', 'Atendimento', 'Visualizador'].map((role) => (
              <option key={role}>{role}</option>
            ))}
          </Select>
          {success && (
            <p role="status" className="text-sm text-approval">
              Convite enviado por e-mail.
            </p>
          )}
          {inviteError && (
            <p role="alert" className="text-sm text-revision">
              {inviteError}
            </p>
          )}
          <Button onClick={() => void invite()} loading={submitting}>
            Enviar convite
          </Button>
        </div>
      </Modal>
    </div>
  )
}
