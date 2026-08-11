import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { PortalCustomizationEditor } from '@/components/portal/PortalCustomizationEditor'
import { EmptyState } from '@/components/ui/DataDisplay'
import { useAppData } from '@/contexts/AppDataContext'
import { dadosApi } from '@/services/api/dadosApi'
import { portalConfiguracoesApi } from '@/services/api/portalConfiguracoesApi'
import type { ProjectStatus, TeamMember } from '@/types/domain'
import { ContatosClienteSettings } from './ContatosClienteSettings'
import { DangerZone } from './DangerZone'
import { GeneralSettings } from './GeneralSettings'
import { ParticipantsSettings } from './ParticipantsSettings'
import { PortalSettings } from './PortalSettings'
import { SettingsSection } from './SettingsSection'
import {
  dataInput,
  diasAPartirDeHoje,
  type ExpiracaoPreset,
  type PermissaoParticipante,
  type PortalPermissoes,
} from './settingsHelpers'

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
  const [portalActive, setPortalActive] = useState(true)

  const [memberIds, setMemberIds] = useState<string[]>([])
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

  const [confirmExcluir, setConfirmExcluir] = useState('')

  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)
  const [infoErro, setInfoErro] = useState('')
  const [participantesSaving, setParticipantesSaving] = useState(false)
  const [participantesMsg, setParticipantesMsg] = useState('')
  const [participantesErro, setParticipantesErro] = useState('')
  const [portalSaving, setPortalSaving] = useState(false)
  const [portalMsg, setPortalMsg] = useState('')
  const [portalErro, setPortalErro] = useState('')
  const [dangerSaving, setDangerSaving] = useState(false)
  const [dangerMsg, setDangerMsg] = useState('')
  const [dangerErro, setDangerErro] = useState('')

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
    setPortalActive(project.portalActive !== false)
    setMemberIds(project.memberIds ?? [])
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
    return memberIds
      .map((id) => membrosAtivos.find((membro) => membro.id === id))
      .filter((item): item is TeamMember => Boolean(item))
  }, [memberIds, membrosAtivos])

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
        startDate: startDate || null,
        dueDate: dueDate || null,
        portalActive,
      })
      if (
        responsavelId &&
        (proximosMembers.join() !== (project.memberIds ?? []).join() ||
          responsavelId !== (project.memberIds[0] ?? ''))
      ) {
        await updateProjectParticipants(projectId, {
          memberIds: proximosMembers,
          approverIds: [],
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
      await updateProjectParticipants(projectId, {
        memberIds,
        approverIds: [],
        permissoes: memberIds.map((usuarioId) => {
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
      <GeneralSettings
        name={name}
        description={description}
        clientId={clientId}
        type={type}
        responsavelId={responsavelId}
        startDate={startDate}
        dueDate={dueDate}
        status={status}
        clients={clients}
        membrosAtivos={membrosAtivos}
        infoSaving={infoSaving}
        infoSaved={infoSaved}
        infoErro={infoErro}
        onName={setName}
        onDescription={setDescription}
        onClientId={setClientId}
        onType={setType}
        onResponsavelId={setResponsavelId}
        onStartDate={setStartDate}
        onDueDate={setDueDate}
        onSalvar={() => void salvarInfo()}
      />

      <ParticipantsSettings
        membrosAtivos={membrosAtivos}
        memberIds={memberIds}
        participantesVisiveis={participantesVisiveis}
        permissoes={permissoes}
        participantesSaving={participantesSaving}
        participantesMsg={participantesMsg}
        participantesErro={participantesErro}
        onToggleMembros={(id, checked) =>
          toggleLista(memberIds, id, checked, false, setMemberIds)
        }
        onAtualizarPermissao={atualizarPermissao}
        onSalvar={() => void salvarParticipantes()}
      />

      <ContatosClienteSettings clienteId={clientId} />

      <PortalSettings
        portalActive={portalActive}
        portalLink={portalLink}
        portalAcessos={portalAcessos}
        portalUltimoAcessoEm={portalUltimoAcessoEm}
        portalCriadoEm={portalCriadoEm}
        portalPerms={portalPerms}
        senhaPortal={senhaPortal}
        protegido={protegido}
        expiraPreset={expiraPreset}
        expiraEm={expiraEm}
        portalSaving={portalSaving}
        portalMsg={portalMsg}
        portalErro={portalErro}
        onPortalActive={(checked) => {
          setPortalActive(checked)
          void salvarPortal({ portalActive: checked })
        }}
        onPortalPerms={setPortalPerms}
        onSenhaPortal={setSenhaPortal}
        onExpiraPreset={setExpiraPreset}
        onExpiraEm={setExpiraEm}
        onCopiarLink={() => void copiarLink()}
        onRegenerarLink={() => void regenerarLink()}
        onRevogarLink={() => void revogarLink()}
        onSalvar={() => void salvarPortal()}
      />

      <SettingsSection
        title="Aparência"
        description="Personalize cores, mensagens e identidade do portal deste projeto."
      >
        <PortalCustomizationEditor escopo="projeto" id={projectId} />
      </SettingsSection>

      <DangerZone
        projectName={project.name}
        status={status}
        confirmExcluir={confirmExcluir}
        dangerSaving={dangerSaving}
        dangerMsg={dangerMsg}
        dangerErro={dangerErro}
        onConfirmExcluir={setConfirmExcluir}
        onArquivar={() => void arquivar()}
        onRestaurar={() => void restaurar()}
        onExcluir={() => void excluir()}
      />
    </div>
  )
}
