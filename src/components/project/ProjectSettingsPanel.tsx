import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { PortalCustomizationEditor } from '@/components/portal/PortalCustomizationEditor'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/DataDisplay'
import {
  Checkbox,
  Input,
  Radio,
  Select,
  Switch,
  Textarea,
} from '@/components/ui/FormControls'
import { useAppData } from '@/contexts/AppDataContext'
import { PROJECT_STATUS_OPTIONS, PROJECT_TYPES } from '@/lib/projectCatalog'
import { assinaturasApi } from '@/services/api/assinaturasApi'
import { dadosApi } from '@/services/api/dadosApi'
import { portalConfiguracoesApi } from '@/services/api/portalConfiguracoesApi'
import type { ApprovalMode, ProjectStatus, TeamMember } from '@/types/domain'

type PermissaoParticipante = {
  podeEnviarMateriais: boolean
  podeResponderComentarios: boolean
}

type PortalPermissoes = {
  permitirComentarios: boolean
  permitirAprovacao: boolean
  permitirSolicitacaoAlteracoes: boolean
  permitirDownloads: boolean
  permitirVersoesAntigas: boolean
}

type ExpiracaoPreset = 'nenhuma' | '7' | '30' | 'personalizada'

function dataInput(valor?: string | null) {
  if (!valor) return ''
  return String(valor).slice(0, 10)
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR')
}

function diasAPartirDeHoje(dias: number) {
  const data = new Date()
  data.setHours(12, 0, 0, 0)
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

function inicialNome(nome: string) {
  return (nome.trim()[0] ?? '?').toUpperCase()
}

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string
  description?: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section
      className={
        danger
          ? 'rounded-lg border border-revision/40 bg-revision/5 p-5'
          : 'rounded-lg border border-line bg-surface p-5'
      }
    >
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function ProjectSettingsPanel({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const { projects, clients, team, refresh, updateProjectParticipants } = useAppData()
  const project = projects.find((item) => item.id === projectId)
  const membrosAtivos = useMemo(() => team.filter((item) => item.status === 'active'), [team])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState('Campanha')
  const [responsavelId, setResponsavelId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('draft')
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('any')
  const [portalActive, setPortalActive] = useState(true)

  const [memberIds, setMemberIds] = useState<string[]>([])
  const [approverIds, setApproverIds] = useState<string[]>([])
  const [permissoes, setPermissoes] = useState<Map<string, PermissaoParticipante>>(new Map())

  const [portalLink, setPortalLink] = useState('')
  const [portalPerms, setPortalPerms] = useState<PortalPermissoes>({
    permitirComentarios: true,
    permitirAprovacao: true,
    permitirSolicitacaoAlteracoes: true,
    permitirDownloads: false,
    permitirVersoesAntigas: false,
  })
  const [senhaPortal, setSenhaPortal] = useState('')
  const [protegido, setProtegido] = useState(false)
  const [expiraPreset, setExpiraPreset] = useState<ExpiracaoPreset>('nenhuma')
  const [expiraEm, setExpiraEm] = useState('')
  const [portalAcessos, setPortalAcessos] = useState(0)
  const [portalUltimoAcessoEm, setPortalUltimoAcessoEm] = useState<string | null>(null)
  const [portalCriadoEm, setPortalCriadoEm] = useState<string | null>(null)

  const [variosAprovadores, setVariosAprovadores] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState('')

  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)
  const [infoErro, setInfoErro] = useState('')
  const [participantesSaving, setParticipantesSaving] = useState(false)
  const [participantesMsg, setParticipantesMsg] = useState('')
  const [participantesErro, setParticipantesErro] = useState('')
  const [aprovacaoSaving, setAprovacaoSaving] = useState(false)
  const [aprovacaoMsg, setAprovacaoMsg] = useState('')
  const [aprovacaoErro, setAprovacaoErro] = useState('')
  const [portalSaving, setPortalSaving] = useState(false)
  const [portalMsg, setPortalMsg] = useState('')
  const [portalErro, setPortalErro] = useState('')
  const [dangerSaving, setDangerSaving] = useState(false)
  const [dangerMsg, setDangerMsg] = useState('')
  const [dangerErro, setDangerErro] = useState('')

  useEffect(() => {
    void assinaturasApi
      .limites()
      .then(({ dado }) => setVariosAprovadores(Boolean(dado.recursos.permiteVariosAprovadores)))
      .catch(() => setVariosAprovadores(false))
  }, [])

  useEffect(() => {
    if (!project) return
    setName(project.name)
    setDescription(project.description ?? '')
    setClientId(project.clientId)
    setType(project.type || 'Campanha')
    setResponsavelId(project.memberIds[0] ?? '')
    setStartDate(dataInput(project.startDate))
    setDueDate(dataInput(project.dueDate))
    setStatus(project.status)
    setApprovalMode(project.approvalMode ?? 'any')
    setPortalActive(project.portalActive !== false)
    setMemberIds(project.memberIds ?? [])
    setApproverIds(project.approverIds ?? [])
  }, [project?.id, project?.updatedAt])

  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      try {
        const [detalhe, config] = await Promise.all([
          dadosApi.projetoDetalhe(projectId),
          portalConfiguracoesApi.carregar('projeto', projectId),
        ])
        if (!ativo) return
        const dado = detalhe.dado
        setPortalAcessos(Number(dado.portalAcessos ?? 0))
        setPortalUltimoAcessoEm(dado.portalUltimoAcessoEm ? String(dado.portalUltimoAcessoEm) : null)
        setPortalCriadoEm(dado.portalCriadoEm ? String(dado.portalCriadoEm) : null)
        if (dado.modoAprovacao) setApprovalMode(dado.modoAprovacao === 'todos' ? 'all' : 'any')
        if (dado.portalAtivo != null) setPortalActive(Boolean(dado.portalAtivo))
        if (dado.dataInicio) setStartDate(dataInput(String(dado.dataInicio)))

        const mapa = new Map<string, PermissaoParticipante>()
        for (const item of dado.participantes ?? []) {
          mapa.set(item.usuarioId, {
            podeEnviarMateriais: item.podeEnviarMateriais !== false,
            podeResponderComentarios: item.podeResponderComentarios !== false,
          })
        }
        setPermissoes(mapa)

        const conf = config.dado.configuracao
        setPortalPerms({
          permitirComentarios: conf.permitirComentarios !== false,
          permitirAprovacao: conf.permitirAprovacao !== false,
          permitirSolicitacaoAlteracoes: conf.permitirSolicitacaoAlteracoes !== false,
          permitirDownloads: conf.permitirDownloads === true,
          permitirVersoesAntigas: conf.permitirVersoesAntigas === true,
        })
        setProtegido(Boolean(config.dado.protegido))
        const expira = config.dado.expiraEm
        if (!expira) {
          setExpiraPreset('nenhuma')
          setExpiraEm('')
        } else {
          setExpiraPreset('personalizada')
          setExpiraEm(dataInput(expira))
        }
      } catch {
        /* mantém estado local se o detalhe falhar */
      }
      try {
        const { dado } = await dadosApi.linkPortal(projectId)
        if (ativo) setPortalLink(dado.link)
      } catch {
        if (ativo) setPortalLink('')
      }
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [projectId])

  const participantesVisiveis = useMemo(() => {
    const ids = [...new Set([...memberIds, ...approverIds])]
    return ids
      .map((id) => membrosAtivos.find((membro) => membro.id === id))
      .filter((item): item is TeamMember => Boolean(item))
  }, [memberIds, approverIds, membrosAtivos])

  if (!project) {
    return (
      <EmptyState
        title="Projeto não encontrado"
        description="Não foi possível carregar as configurações deste projeto."
      />
    )
  }

  const toggleLista = (
    lista: string[],
    id: string,
    checked: boolean,
    unico: boolean,
    onChange: (ids: string[]) => void,
  ) => {
    if (!checked) {
      onChange(lista.filter((item) => item !== id))
      return
    }
    onChange(unico ? [id] : [...lista.filter((item) => item !== id), id])
    setPermissoes((atual) => {
      if (atual.has(id)) return atual
      const proximo = new Map(atual)
      proximo.set(id, { podeEnviarMateriais: true, podeResponderComentarios: true })
      return proximo
    })
  }

  const atualizarPermissao = (
    usuarioId: string,
    campo: keyof PermissaoParticipante,
    valor: boolean,
  ) => {
    setPermissoes((atual) => {
      const atualItem = atual.get(usuarioId) ?? {
        podeEnviarMateriais: true,
        podeResponderComentarios: true,
      }
      const proximo = new Map(atual)
      proximo.set(usuarioId, { ...atualItem, [campo]: valor })
      return proximo
    })
  }

  const salvarInfo = async () => {
    setInfoErro('')
    setInfoSaved(false)
    setInfoSaving(true)
    try {
      let proximosMembers = [...memberIds]
      if (responsavelId) {
        proximosMembers = [responsavelId, ...memberIds.filter((id) => id !== responsavelId)]
      }
      await dadosApi.atualizarProjeto(projectId, {
        name: name.trim(),
        description: description.trim() || null,
        clientId,
        type,
        status,
        startDate: startDate || null,
        dueDate: dueDate || null,
        approvalMode,
        portalActive,
      })
      if (
        responsavelId &&
        (proximosMembers.join() !== (project.memberIds ?? []).join() ||
          responsavelId !== (project.memberIds[0] ?? ''))
      ) {
        await updateProjectParticipants(projectId, {
          memberIds: proximosMembers,
          approverIds,
        })
        setMemberIds(proximosMembers)
      } else {
        await refresh()
      }
      setInfoSaved(true)
    } catch (erro) {
      setInfoErro(erro instanceof Error ? erro.message : 'Não foi possível salvar as informações.')
    } finally {
      setInfoSaving(false)
    }
  }

  const salvarParticipantes = async () => {
    setParticipantesMsg('')
    setParticipantesErro('')
    setParticipantesSaving(true)
    try {
      const ids = [...new Set([...memberIds, ...approverIds])]
      await updateProjectParticipants(projectId, {
        memberIds,
        approverIds,
        permissoes: ids.map((usuarioId) => {
          const item = permissoes.get(usuarioId)
          return {
            usuarioId,
            podeEnviarMateriais: item?.podeEnviarMateriais ?? true,
            podeResponderComentarios: item?.podeResponderComentarios ?? true,
          }
        }),
      })
      setParticipantesMsg('Participantes atualizados.')
    } catch (erro) {
      setParticipantesErro(
        erro instanceof Error ? erro.message : 'Não foi possível salvar os participantes.',
      )
    } finally {
      setParticipantesSaving(false)
    }
  }

  const salvarModoAprovacao = async (modo: ApprovalMode) => {
    setApprovalMode(modo)
    setAprovacaoMsg('')
    setAprovacaoErro('')
    setAprovacaoSaving(true)
    try {
      await dadosApi.atualizarProjeto(projectId, { approvalMode: modo })
      await refresh()
      setAprovacaoMsg('Modo de aprovação atualizado.')
    } catch (erro) {
      setAprovacaoErro(
        erro instanceof Error ? erro.message : 'Não foi possível salvar o modo de aprovação.',
      )
    } finally {
      setAprovacaoSaving(false)
    }
  }

  const resolverExpiraEm = (): string | null => {
    if (expiraPreset === 'nenhuma') return null
    if (expiraPreset === '7') return diasAPartirDeHoje(7)
    if (expiraPreset === '30') return diasAPartirDeHoje(30)
    return expiraEm.trim() || null
  }

  const salvarPortal = async (overrides?: Partial<{ portalActive: boolean }>) => {
    setPortalMsg('')
    setPortalErro('')
    setPortalSaving(true)
    try {
      const ativo = overrides?.portalActive ?? portalActive
      await dadosApi.atualizarProjeto(projectId, { portalActive: ativo })
      await portalConfiguracoesApi.salvar('projeto', projectId, {
        configuracao: { ...portalPerms },
        senha: senhaPortal.trim() ? senhaPortal.trim() : undefined,
        expiraEm: resolverExpiraEm(),
      })
      setSenhaPortal('')
      await refresh()
      setPortalMsg('Portal atualizado.')
    } catch (erro) {
      setPortalErro(erro instanceof Error ? erro.message : 'Não foi possível salvar o portal.')
    } finally {
      setPortalSaving(false)
    }
  }

  const copiarLink = async () => {
    setPortalMsg('')
    setPortalErro('')
    try {
      const { dado } = await dadosApi.linkPortal(projectId)
      setPortalLink(dado.link)
      try {
        await navigator.clipboard.writeText(dado.link)
        setPortalMsg('Link copiado.')
      } catch {
        setPortalMsg(dado.link)
        setPortalErro('Não foi possível copiar. Selecione e copie o link acima.')
      }
    } catch (erro) {
      setPortalErro(erro instanceof Error ? erro.message : 'Não foi possível obter o link.')
    }
  }

  const regenerarLink = async () => {
    const ok = window.confirm(
      'Gerar um novo link invalida o anterior. O cliente precisará do novo endereço. Continuar?',
    )
    if (!ok) return
    setPortalMsg('')
    setPortalErro('')
    setPortalSaving(true)
    try {
      const { mensagem, dado } = await dadosApi.regenerarLinkPortal(projectId)
      if (dado?.link) setPortalLink(dado.link)
      setPortalAcessos(0)
      setPortalUltimoAcessoEm(null)
      setPortalCriadoEm(new Date().toISOString())
      setPortalMsg(mensagem || 'Novo link gerado.')
    } catch (erro) {
      setPortalErro(erro instanceof Error ? erro.message : 'Não foi possível gerar um novo link.')
    } finally {
      setPortalSaving(false)
    }
  }

  const revogarLink = async () => {
    const ok = window.confirm('Revogar o link do portal? O endereço atual deixará de funcionar.')
    if (!ok) return
    setPortalMsg('')
    setPortalErro('')
    setPortalSaving(true)
    try {
      const { mensagem } = await dadosApi.revogarLinkPortal(projectId)
      setPortalLink('')
      setPortalAcessos(0)
      setPortalUltimoAcessoEm(null)
      setPortalCriadoEm(null)
      setPortalMsg(mensagem || 'Link revogado.')
    } catch (erro) {
      setPortalErro(erro instanceof Error ? erro.message : 'Não foi possível revogar o link.')
    } finally {
      setPortalSaving(false)
    }
  }

  const arquivar = async () => {
    setDangerMsg('')
    setDangerErro('')
    setDangerSaving(true)
    try {
      await dadosApi.atualizarProjeto(projectId, { status: 'archived' })
      setStatus('archived')
      await refresh()
      setDangerMsg('Projeto arquivado.')
    } catch (erro) {
      setDangerErro(erro instanceof Error ? erro.message : 'Não foi possível arquivar o projeto.')
    } finally {
      setDangerSaving(false)
    }
  }

  const restaurar = async () => {
    setDangerMsg('')
    setDangerErro('')
    setDangerSaving(true)
    try {
      await dadosApi.restaurarProjeto(projectId)
      setStatus('in-progress')
      await refresh()
      setDangerMsg('Projeto restaurado.')
    } catch (erro) {
      setDangerErro(erro instanceof Error ? erro.message : 'Não foi possível restaurar o projeto.')
    } finally {
      setDangerSaving(false)
    }
  }

  const excluir = async () => {
    if (confirmExcluir.trim() !== project.name) {
      setDangerErro('Digite o nome do projeto exatamente para confirmar a exclusão.')
      return
    }
    const ok = window.confirm(
      `Excluir permanentemente o projeto "${project.name}"? Esta ação não pode ser desfeita facilmente.`,
    )
    if (!ok) return
    setDangerMsg('')
    setDangerErro('')
    setDangerSaving(true)
    try {
      await dadosApi.excluirProjeto(projectId)
      navigate('/app/projetos')
    } catch (erro) {
      setDangerErro(erro instanceof Error ? erro.message : 'Não foi possível excluir o projeto.')
      setDangerSaving(false)
    }
  }

  return (
    <div className="space-y-6 py-2">
      <Section
        title="Informações do projeto"
        description="Nome, cliente, datas e status exibidos na equipe e no portal."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Select
            label="Cliente"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            {clients
              .filter((item) => item.status === 'active' || item.id === clientId)
              .map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.name}
                </option>
              ))}
          </Select>
          <Select label="Tipo" value={type} onChange={(event) => setType(event.target.value)}>
            {PROJECT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select
            label="Responsável"
            value={responsavelId}
            onChange={(event) => setResponsavelId(event.target.value)}
          >
            <option value="">Sem responsável</option>
            {membrosAtivos.map((membro) => {
              const bloqueado = approverIds.includes(membro.id)
              return (
                <option key={membro.id} value={membro.id} disabled={bloqueado}>
                  {bloqueado
                    ? `${membro.name} — Indisponível (já é aprovador)`
                    : membro.name}
                </option>
              )
            })}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          >
            {PROJECT_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input
            label="Início"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="Prazo"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" loading={infoSaving} onClick={() => void salvarInfo()}>
            {infoSaved && !infoSaving ? 'Salvo ✓' : infoSaving ? 'Salvando...' : 'Salvar informações'}
          </Button>
          {infoSaved && !infoErro && (
            <p role="status" className="text-sm text-approval">
              Alterações salvas.
            </p>
          )}
          {infoErro && (
            <p role="alert" className="text-sm text-revision">
              {infoErro}
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Participantes"
        description="Responsáveis e aprovadores são listas separadas: a mesma pessoa não pode estar nas duas."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-ink">Responsáveis</p>
            <p className="mt-1 text-xs text-secondary">Membros que acompanham o projeto.</p>
            <div className="mt-3 grid gap-2">
              {membrosAtivos.map((membro) => {
                const bloqueado = approverIds.includes(membro.id)
                return (
                  <Checkbox
                    key={`resp-${membro.id}`}
                    label={
                      bloqueado
                        ? `${membro.name} — Indisponível (já é aprovador)`
                        : membro.name
                    }
                    checked={memberIds.includes(membro.id)}
                    disabled={bloqueado}
                    onChange={(checked) => {
                      if (bloqueado) return
                      toggleLista(memberIds, membro.id, checked, false, setMemberIds)
                    }}
                  />
                )
              })}
              {!membrosAtivos.length && <p className="text-sm text-muted">Nenhum membro ativo.</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Aprovadores</p>
            <p className="mt-1 text-xs text-secondary">
              {variosAprovadores
                ? 'Selecione um ou mais aprovadores.'
                : 'Seu plano permite um aprovador por projeto.'}
            </p>
            <div className="mt-3 grid gap-2">
              {membrosAtivos.map((membro) => {
                const bloqueado = memberIds.includes(membro.id)
                return (
                  <Checkbox
                    key={`aprov-${membro.id}`}
                    label={
                      bloqueado
                        ? `${membro.name} — Indisponível (já é responsável)`
                        : membro.name
                    }
                    checked={approverIds.includes(membro.id)}
                    disabled={bloqueado}
                    onChange={(checked) => {
                      if (bloqueado) return
                      toggleLista(
                        approverIds,
                        membro.id,
                        checked,
                        !variosAprovadores,
                        setApproverIds,
                      )
                    }}
                  />
                )
              })}
              {!membrosAtivos.length && <p className="text-sm text-muted">Nenhum membro ativo.</p>}
            </div>
          </div>
        </div>

        <div className="mt-5 divide-y divide-line rounded-md border border-line">
          {participantesVisiveis.map((membro) => {
            const perms = permissoes.get(membro.id) ?? {
              podeEnviarMateriais: true,
              podeResponderComentarios: true,
            }
            const tipos: string[] = []
            if (memberIds.includes(membro.id)) tipos.push('Responsável')
            if (approverIds.includes(membro.id)) tipos.push('Aprovador')
            return (
              <div
                key={membro.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                    {inicialNome(membro.name)}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{membro.name}</p>
                    <p className="text-xs text-muted">{membro.email}</p>
                    <p className="mt-1 text-xs text-secondary">
                      {membro.role} · {tipos.join(' · ') || 'Participante'}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:justify-items-end">
                  <Checkbox
                    label="Pode enviar materiais"
                    checked={perms.podeEnviarMateriais}
                    onChange={(checked) =>
                      atualizarPermissao(membro.id, 'podeEnviarMateriais', checked)
                    }
                  />
                  <Checkbox
                    label="Pode responder comentários"
                    checked={perms.podeResponderComentarios}
                    onChange={(checked) =>
                      atualizarPermissao(membro.id, 'podeResponderComentarios', checked)
                    }
                  />
                </div>
              </div>
            )
          })}
          {!participantesVisiveis.length && (
            <p className="p-4 text-sm text-muted">Nenhum participante selecionado.</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            loading={participantesSaving}
            onClick={() => void salvarParticipantes()}
          >
            Salvar participantes
          </Button>
          {participantesMsg && (
            <p role="status" className="text-sm text-approval">
              {participantesMsg}
            </p>
          )}
          {participantesErro && (
            <p role="alert" className="text-sm text-revision">
              {participantesErro}
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Aprovadores"
        description="Quem pode finalizar materiais e como o consenso funciona."
      >
        <ul className="space-y-2 text-sm">
          {approverIds.map((id) => {
            const membro = membrosAtivos.find((item) => item.id === id)
            return (
              <li key={id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold">
                  {inicialNome(membro?.name ?? '?')}
                </span>
                <span>
                  {membro?.name ?? 'Usuário'}
                  {membro?.email ? (
                    <span className="text-muted"> · {membro.email}</span>
                  ) : null}
                </span>
              </li>
            )
          })}
          {!approverIds.length && (
            <li className="text-muted">Nenhum aprovador definido neste projeto.</li>
          )}
        </ul>
        <p className="mt-3 text-xs text-secondary">
          O status de aprovação de cada material continua sendo registrado nas revisões.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-ink">Modo de aprovação</p>
          <Radio
            label="Qualquer aprovador pode finalizar"
            checked={approvalMode === 'any'}
            onChange={(checked) => {
              if (checked) void salvarModoAprovacao('any')
            }}
          />
          <Radio
            label="Todos os aprovadores precisam aprovar"
            checked={approvalMode === 'all'}
            onChange={(checked) => {
              if (checked) void salvarModoAprovacao('all')
            }}
          />
          {!variosAprovadores && approvalMode === 'all' && (
            <p className="text-xs text-secondary">
              Seu plano atual limita a um aprovador; o modo “todos” será aplicado quando houver
              mais de um.
            </p>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          Etapas de aprovação (em breve): Equipe interna → Marketing → Diretoria
        </p>
        {aprovacaoSaving && (
          <p role="status" className="mt-2 text-sm text-secondary">
            Salvando...
          </p>
        )}
        {aprovacaoMsg && (
          <p role="status" className="mt-2 text-sm text-approval">
            {aprovacaoMsg}
          </p>
        )}
        {aprovacaoErro && (
          <p role="alert" className="mt-2 text-sm text-revision">
            {aprovacaoErro}
          </p>
        )}
      </Section>

      <Section
        title="Portal do cliente"
        description="Link, segurança, validade e o que o cliente pode fazer."
      >
        <Switch
          label="Portal ativo"
          checked={portalActive}
          onChange={(checked) => {
            setPortalActive(checked)
            void salvarPortal({ portalActive: checked })
          }}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void copiarLink()}>
            Copiar link
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!portalLink}
            onClick={() => {
              if (portalLink) window.open(portalLink, '_blank', 'noopener,noreferrer')
            }}
          >
            Ver portal
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={portalSaving}
            onClick={() => void regenerarLink()}
          >
            Gerar novo link
          </Button>
          <Button type="button" variant="destructive" onClick={() => void revogarLink()}>
            Revogar link
          </Button>
        </div>

        {portalLink && (
          <p className="mt-3 break-all text-xs text-muted" role="status">
            {portalLink}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Último acesso</p>
            <p className="mt-1 text-sm">{formatarDataHora(portalUltimoAcessoEm)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Acessos</p>
            <p className="mt-1 text-sm">{portalAcessos}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Link criado em</p>
            <p className="mt-1 text-sm">{formatarDataHora(portalCriadoEm)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <p className="text-sm font-medium text-ink">Permissões do cliente</p>
          <Switch
            label="Permitir comentários"
            checked={portalPerms.permitirComentarios}
            onChange={(checked) =>
              setPortalPerms((atual) => ({ ...atual, permitirComentarios: checked }))
            }
          />
          <Switch
            label="Permitir aprovação"
            checked={portalPerms.permitirAprovacao}
            onChange={(checked) =>
              setPortalPerms((atual) => ({ ...atual, permitirAprovacao: checked }))
            }
          />
          <Switch
            label="Permitir solicitação de alterações"
            checked={portalPerms.permitirSolicitacaoAlteracoes}
            onChange={(checked) =>
              setPortalPerms((atual) => ({ ...atual, permitirSolicitacaoAlteracoes: checked }))
            }
          />
          <Switch
            label="Permitir downloads"
            checked={portalPerms.permitirDownloads}
            onChange={(checked) =>
              setPortalPerms((atual) => ({ ...atual, permitirDownloads: checked }))
            }
          />
          <Switch
            label="Permitir versões antigas"
            checked={portalPerms.permitirVersoesAntigas}
            onChange={(checked) =>
              setPortalPerms((atual) => ({ ...atual, permitirVersoesAntigas: checked }))
            }
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label={protegido ? 'Nova senha do portal' : 'Senha do portal'}
            type="password"
            value={senhaPortal}
            placeholder={protegido ? 'Deixe em branco para manter' : 'Opcional'}
            onChange={(event) => setSenhaPortal(event.target.value)}
          />
          <Select
            label="Expiração do link"
            value={expiraPreset}
            onChange={(event) => setExpiraPreset(event.target.value as ExpiracaoPreset)}
          >
            <option value="nenhuma">Sem expiração</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="personalizada">Data personalizada</option>
          </Select>
          {expiraPreset === 'personalizada' && (
            <Input
              label="Data de expiração"
              type="date"
              value={expiraEm}
              onChange={(event) => setExpiraEm(event.target.value)}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" loading={portalSaving} onClick={() => void salvarPortal()}>
            Salvar portal
          </Button>
          {portalMsg && (
            <p role="status" className="text-sm text-approval">
              {portalMsg}
            </p>
          )}
          {portalErro && (
            <p role="alert" className="text-sm text-revision">
              {portalErro}
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Aparência"
        description="Personalize cores, mensagens e identidade do portal deste projeto."
      >
        <PortalCustomizationEditor escopo="projeto" id={projectId} />
      </Section>

      <Section
        title="Zona de perigo"
        description="Ações irreversíveis ou que removem o projeto da lista ativa."
        danger
      >
        <div className="flex flex-wrap gap-3">
          {status !== 'archived' ? (
            <Button
              type="button"
              variant="outline"
              loading={dangerSaving}
              onClick={() => void arquivar()}
            >
              Arquivar projeto
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              loading={dangerSaving}
              onClick={() => void restaurar()}
            >
              Restaurar projeto
            </Button>
          )}
        </div>

        <div className="mt-6 border-t border-revision/30 pt-5">
          <p className="text-sm font-medium text-revision">Excluir projeto</p>
          <p className="mt-1 text-xs text-secondary">
            Digite <span className="font-semibold text-ink">{project.name}</span> para confirmar.
          </p>
          <div className="mt-3 max-w-md">
            <Input
              label="Confirmação"
              value={confirmExcluir}
              onChange={(event) => setConfirmExcluir(event.target.value)}
              placeholder={project.name}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            loading={dangerSaving}
            disabled={confirmExcluir.trim() !== project.name}
            onClick={() => void excluir()}
          >
            Excluir permanentemente
          </Button>
        </div>

        {dangerMsg && (
          <p role="status" className="mt-3 text-sm text-approval">
            {dangerMsg}
          </p>
        )}
        {dangerErro && (
          <p role="alert" className="mt-3 text-sm text-revision">
            {dangerErro}
          </p>
        )}
      </Section>
    </div>
  )
}
