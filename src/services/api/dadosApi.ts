import type {
  Activity,
  Client,
  Material,
  MaterialVersion,
  Notification,
  Project,
  ReviewComment,
  TeamMember,
  Workspace,
} from '@/types/domain'
import { json, requisicaoApi } from './clienteHttp'

type Lista<T> = { dados: T[] }
type ClienteBanco = {
  id: string
  workspaceId: string
  nome: string
  empresa?: string | null
  email?: string | null
  telefone?: string | null
  observacoes?: string | null
  corIdentificacao?: string | null
  status: 'ativo' | 'arquivado'
  criadoEm: Date | string
  atualizadoEm: Date | string
}
type ProjetoBanco = {
  id: string
  clienteId: string
  nome: string
  descricao?: string | null
  tipo: string
  status: string
  prazoEm?: Date | string | null
  atualizadoEm: Date | string
}
type MaterialBanco = {
  id: string
  projetoId: string
  nome: string
  tipo: string
  status: string
  versaoAtualId?: string | null
  criadoEm: Date | string
  atualizadoEm: Date | string
}
type ItemMaterial = {
  material: MaterialBanco
  numeroVersao?: number | null
  comentarios: number
  pendencias: number
}
type ArquivoBanco = { id: string }
type VersaoBanco = {
  id: string
  materialId: string
  numero: number
  nome: string
  descricao?: string | null
  atual: boolean
  aprovada: boolean
  criadaPorUsuarioId: string
  criadoEm: Date | string
}
type DetalheMaterial = {
  dado: {
    material: MaterialBanco
    versoes: Array<{ versao: VersaoBanco; arquivo: ArquivoBanco }>
    totais: { comentarios: number; pendencias: number }
  }
}
type ComentarioBanco = {
  id: string
  materialId: string
  versaoMaterialId: string
  usuarioId: string | null
  texto: string
  posicaoX: string | number
  posicaoY: string | number
  status: 'aberto' | 'resolvido'
  criadoEm: Date | string
  atualizadoEm: Date | string
  comentarioOrigemId?: string | null
}
type RespostaBanco = {
  id: string
  comentarioId: string
  usuarioId: string
  texto: string
  criadoEm: Date | string
}
type ItemComentario = {
  comentario: ComentarioBanco
  autorNome: string
  respostas: Array<{ resposta: RespostaBanco; autorNome: string }>
}

const statusProjeto = {
  rascunho: 'draft',
  em_revisao: 'in-review',
  alteracoes_solicitadas: 'changes-requested',
  aguardando_aprovacao: 'waiting-approval',
  aprovado: 'approved',
  arquivado: 'archived',
} as const
const statusMaterial = {
  rascunho: 'draft',
  em_revisao: 'in-review',
  alteracoes_solicitadas: 'changes-requested',
  aguardando_aprovacao: 'waiting-approval',
  aprovado: 'approved',
} as const
const tipoMaterial = {
  imagem: 'image',
  video: 'video',
  pdf: 'pdf',
  apresentacao: 'presentation',
  pagina_web: 'web',
} as const

export async function carregarDadosApi() {
  const [w, c, p, m, t, convites, a, n] = await Promise.all([
    requisicaoApi<{
      dado: { id: string; nome: string; slug: string; plano: Workspace['plan']; criadoEm: string }
    }>('/api/workspaces/atual'),
    requisicaoApi<Lista<ClienteBanco>>('/api/clientes?porPagina=100'),
    requisicaoApi<Lista<ProjetoBanco>>('/api/projetos?porPagina=100'),
    requisicaoApi<Lista<ItemMaterial>>('/api/materiais?porPagina=100'),
    requisicaoApi<
      Lista<{
        id: string
        nome: string
        email: string
        avatarUrl?: string | null
        funcao: string
        status: string
        entrouEm?: string | null
      }>
    >('/api/usuarios/equipe'),
    requisicaoApi<
      Lista<{ id: string; email: string; funcao: string; criadoEm: string; expiraEm: string }>
    >('/api/equipe/convites'),
    requisicaoApi<
      Lista<{
        atividade: {
          id: string
          workspaceId: string
          usuarioId: string
          materialId?: string | null
          versaoMaterialId?: string | null
          tipo: string
          descricao: string
          criadoEm: string
        }
        autorNome: string
      }>
    >('/api/atividades'),
    requisicaoApi<
      Lista<{
        id: string
        titulo: string
        descricao: string
        tipo: string
        lidaEm?: string | null
        criadoEm: string
      }>
    >('/api/notificacoes'),
  ])
  const details = await Promise.all(
    m.dados.map(async (item) => {
      const [detalhe, comentarios] = await Promise.all([
        requisicaoApi<DetalheMaterial>(`/api/materiais/${item.material.id}`),
        requisicaoApi<Lista<ItemComentario>>(`/api/materiais/${item.material.id}/comentarios`),
      ])
      return { detalhe, comentarios }
    }),
  )
  const materials: Material[] = m.dados.map((item) => ({
    id: item.material.id,
    projectId: item.material.projetoId,
    name: item.material.nome,
    type: tipoMaterial[item.material.tipo as keyof typeof tipoMaterial] ?? 'image',
    status: statusMaterial[item.material.status as keyof typeof statusMaterial] ?? 'draft',
    currentVersionId: item.material.versaoAtualId ?? '',
    currentVersion: Number(item.numeroVersao ?? 0),
    commentCount: Number(item.comentarios ?? 0),
    unresolvedCommentCount: Number(item.pendencias ?? 0),
    createdAt: String(item.material.criadoEm),
    updatedAt: String(item.material.atualizadoEm),
  }))
  const materialVersions: MaterialVersion[] = details.flatMap(({ detalhe }) =>
    detalhe.dado.versoes.map(({ versao, arquivo }) => ({
      id: versao.id,
      materialId: versao.materialId,
      number: versao.numero,
      label: versao.nome,
      description: versao.descricao ?? undefined,
      imageUrl: `/arquivos/${arquivo.id}`,
      createdBy: versao.criadaPorUsuarioId,
      createdAt: String(versao.criadoEm),
      approved: versao.aprovada,
    })),
  )
  const comments: ReviewComment[] = details.flatMap(({ comentarios }) =>
    comentarios.dados.map(({ comentario, autorNome, respostas }) => ({
      id: comentario.id,
      materialId: comentario.materialId,
      versionId: comentario.versaoMaterialId,
      authorId: comentario.usuarioId ?? `portal:${comentario.id}`,
      authorName: autorNome,
      text: comentario.texto,
      x: Number(comentario.posicaoX),
      y: Number(comentario.posicaoY),
      status: comentario.status === 'aberto' ? 'open' : 'resolved',
      createdAt: String(comentario.criadoEm),
      updatedAt: String(comentario.atualizadoEm),
      originCommentId: comentario.comentarioOrigemId ?? undefined,
      replies: respostas.map(({ resposta, autorNome: nome }) => ({
        id: resposta.id,
        commentId: resposta.comentarioId,
        authorId: resposta.usuarioId,
        authorName: nome,
        text: resposta.texto,
        createdAt: String(resposta.criadoEm),
      })),
    })),
  )
  return {
    workspace: {
      id: w.dado.id,
      name: w.dado.nome,
      slug: w.dado.slug,
      plan: w.dado.plano,
      createdAt: String(w.dado.criadoEm),
    } satisfies Workspace,
    clients: c.dados.map<Client>((x) => ({
      id: x.id,
      workspaceId: x.workspaceId,
      name: x.nome,
      company: x.empresa ?? undefined,
      email: x.email ?? undefined,
      phone: x.telefone ?? undefined,
      notes: x.observacoes ?? undefined,
      color: x.corIdentificacao ?? undefined,
      status: x.status === 'ativo' ? 'active' : 'archived',
      projectCount: p.dados.filter((y) => y.clienteId === x.id).length,
      pendingApprovals: 0,
      createdAt: String(x.criadoEm),
      updatedAt: String(x.atualizadoEm),
    })),
    projects: p.dados.map<Project>((x) => ({
      id: x.id,
      clientId: x.clienteId,
      name: x.nome,
      description: x.descricao ?? undefined,
      type: x.tipo,
      status: statusProjeto[x.status as keyof typeof statusProjeto] ?? 'draft',
      dueDate: x.prazoEm ? String(x.prazoEm) : undefined,
      progress: 0,
      materialCount: materials.filter((y) => y.projectId === x.id).length,
      commentCount: materials
        .filter((y) => y.projectId === x.id)
        .reduce((s, y) => s + y.unresolvedCommentCount, 0),
      members: [],
      updatedAt: String(x.atualizadoEm),
    })),
    materials,
    materialVersions,
    comments,
    team: [
      ...t.dados.map<TeamMember>((x) => ({
        id: x.id,
        workspaceId: w.dado.id,
        name: x.nome,
        email: x.email,
        avatar: x.avatarUrl ?? undefined,
        role:
          (
            {
              administrador: 'Administrador',
              gestor: 'Gestor',
              criativo: 'Criativo',
              atendimento: 'Atendimento',
              visualizador: 'Visualizador',
            } as const
          )[x.funcao as 'administrador'] ?? 'Visualizador',
        projectCount: 0,
        status: x.status === 'ativo' ? 'active' : 'invited',
        lastAccess: x.entrouEm ? String(x.entrouEm) : 'Convite enviado',
      })),
      ...convites.dados.map<TeamMember>((x) => ({
        id: x.id,
        workspaceId: w.dado.id,
        name: x.email.split('@')[0],
        email: x.email,
        role:
          (
            {
              administrador: 'Administrador',
              gestor: 'Gestor',
              criativo: 'Criativo',
              atendimento: 'Atendimento',
              visualizador: 'Visualizador',
            } as const
          )[x.funcao as 'administrador'] ?? 'Visualizador',
        projectCount: 0,
        status: 'invited',
        lastAccess: 'Convite enviado',
      })),
    ],
    activities: a.dados.map<Activity>((x) => ({
      id: x.atividade.id,
      workspaceId: x.atividade.workspaceId,
      actor: x.autorNome,
      action: x.atividade.descricao,
      target: '',
      tone: x.atividade.tipo.includes('aprov')
        ? 'approval'
        : x.atividade.tipo.includes('alterac')
          ? 'revision'
          : 'neutral',
      createdAt: String(x.atividade.criadoEm),
      materialId: x.atividade.materialId ?? undefined,
      versionId: x.atividade.versaoMaterialId ?? undefined,
    })),
    notifications: n.dados.map<Notification>((x) => ({
      id: x.id,
      title: x.titulo,
      description: x.descricao,
      read: Boolean(x.lidaEm),
      tone: 'neutral',
      createdAt: String(x.criadoEm),
    })),
  }
}

export const dadosApi = {
  convidarMembro: (d: { email: string; role: TeamMember['role'] }) =>
    requisicaoApi<{ mensagem: string }>('/api/equipe/convites', {
      method: 'POST',
      body: json({
        email: d.email,
        funcao: (
          {
            Administrador: 'administrador',
            Gestor: 'gestor',
            Criativo: 'criativo',
            Atendimento: 'atendimento',
            Visualizador: 'visualizador',
            Cliente: 'visualizador',
          } as const
        )[d.role],
      }),
    }),
  reenviarSenhaPortal: (projetoId: string) =>
    requisicaoApi<{ mensagem: string }>(`/api/projetos/${projetoId}/senha-portal`, {
      method: 'POST',
    }),
  cliente: (d: {
    name: string
    company?: string
    email?: string
    phone?: string
    notes?: string
    color?: string
  }) =>
    requisicaoApi<{ dado: { id: string } }>('/api/clientes', {
      method: 'POST',
      body: json({
        nome: d.name,
        empresa: d.company,
        email: d.email,
        telefone: d.phone,
        observacoes: d.notes,
        corIdentificacao: d.color,
      }),
    }),
  projeto: (d: {
    name: string
    clientId: string
    description?: string
    type?: string
    dueDate?: string
  }) =>
    requisicaoApi<{ dado: { id: string } }>('/api/projetos', {
      method: 'POST',
      body: json({
        nome: d.name,
        clienteId: d.clientId,
        descricao: d.description,
        tipo: d.type ?? 'Campanha',
        prazoEm: d.dueDate,
      }),
    }),
  material: (d: { name: string; projectId: string; type: string; file: File }) => {
    const corpo = new FormData()
    corpo.set('nome', d.name)
    corpo.set('projetoId', d.projectId)
    corpo.set('tipo', d.type === 'image' ? 'imagem' : d.type)
    corpo.set('imagem', d.file)
    return requisicaoApi<{ dado: { id: string; versaoId: string } }>('/api/materiais', {
      method: 'POST',
      body: corpo,
    })
  },
  comentario: (d: { materialId: string; versionId: string; text: string; x: number; y: number }) =>
    requisicaoApi<{ dado: { id: string } }>(`/api/materiais/${d.materialId}/comentarios`, {
      method: 'POST',
      body: json({ versaoMaterialId: d.versionId, texto: d.text, posicaoX: d.x, posicaoY: d.y }),
    }),
  editarComentario: (id: string, texto: string) =>
    requisicaoApi(`/api/comentarios/${id}`, { method: 'PATCH', body: json({ texto }) }),
  excluirComentario: (id: string) => requisicaoApi(`/api/comentarios/${id}`, { method: 'DELETE' }),
  responder: (id: string, texto: string) =>
    requisicaoApi(`/api/comentarios/${id}/respostas`, { method: 'POST', body: json({ texto }) }),
  resolver: (id: string) => requisicaoApi(`/api/comentarios/${id}/resolver`, { method: 'POST' }),
  reabrirComentario: (id: string) =>
    requisicaoApi(`/api/comentarios/${id}/reabrir`, { method: 'POST' }),
  solicitar: (id: string, versaoMaterialId: string) =>
    requisicaoApi(`/api/materiais/${id}/solicitar-alteracoes`, {
      method: 'POST',
      body: json({ versaoMaterialId }),
    }),
  aprovar: (id: string, versaoMaterialId: string, confirmarPendencias = true) =>
    requisicaoApi(`/api/materiais/${id}/aprovar`, {
      method: 'POST',
      body: json({ versaoMaterialId, confirmarPendencias }),
    }),
  reabrir: (id: string) => requisicaoApi(`/api/materiais/${id}/reabrir`, { method: 'POST' }),
  versao: (
    id: string,
    d: { label: string; description?: string; copyPending?: boolean; file: File },
  ) => {
    const form = new FormData()
    form.set('imagem', d.file)
    form.set('nome', d.label)
    if (d.description) form.set('descricao', d.description)
    form.set('copiarPendencias', String(Boolean(d.copyPending)))
    return requisicaoApi<{ dado: { id: string } }>(`/api/materiais/${id}/versoes`, {
      method: 'POST',
      body: form,
    })
  },
}
