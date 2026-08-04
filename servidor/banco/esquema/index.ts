import {
  bigint,
  boolean,
  char,
  datetime,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

const id = (nome = 'id') => char(nome, { length: 36 }).notNull()
const data = (nome: string) => datetime(nome, { mode: 'date', fsp: 3 })

export const usuarios = mysqlTable(
  'usuarios',
  {
    id: id().primaryKey(),
    nome: varchar('nome', { length: 160 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    emailVerificadoEm: data('email_verificado_em'),
    ultimoAcessoEm: data('ultimo_acesso_em'),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [uniqueIndex('unq_usuarios_email').on(t.email), index('idx_usuarios_ativo').on(t.ativo)],
)

export const sessoes = mysqlTable(
  'sessoes',
  {
    id: id().primaryKey(),
    usuarioId: id('usuario_id'),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    enderecoIp: varchar('endereco_ip', { length: 64 }),
    agenteUsuario: varchar('agente_usuario', { length: 500 }),
    expiraEm: data('expira_em').notNull(),
    criadoEm: data('criado_em').notNull(),
    revogadoEm: data('revogado_em'),
  },
  (t) => [
    uniqueIndex('unq_sessoes_token_hash').on(t.tokenHash),
    index('idx_sessoes_usuario').on(t.usuarioId),
    index('idx_sessoes_expiracao').on(t.expiraEm),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_sessoes_usuarios',
    }).onDelete('cascade'),
  ],
)

export const workspaces = mysqlTable(
  'workspaces',
  {
    id: id().primaryKey(),
    nome: varchar('nome', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    plano: mysqlEnum('plano', ['freelancer', 'studio', 'agency']).notNull().default('freelancer'),
    logoUrl: varchar('logo_url', { length: 500 }),
    corPrincipal: char('cor_principal', { length: 7 }).notNull().default('#b8ff4f'),
    ativo: boolean('ativo').notNull().default(true),
    criadoPorUsuarioId: id('criado_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    uniqueIndex('unq_workspaces_slug').on(t.slug),
    index('idx_workspaces_ativo').on(t.ativo),
    foreignKey({
      columns: [t.criadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_workspaces_usuarios',
    }),
  ],
)

export const membrosWorkspace = mysqlTable(
  'membros_workspace',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    usuarioId: id('usuario_id'),
    funcao: mysqlEnum('funcao', [
      'administrador',
      'gestor',
      'criativo',
      'atendimento',
      'visualizador',
    ]).notNull(),
    status: mysqlEnum('status', ['ativo', 'convidado', 'suspenso']).notNull().default('ativo'),
    convidadoPorUsuarioId: char('convidado_por_usuario_id', { length: 36 }),
    entrouEm: data('entrou_em'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
  },
  (t) => [
    uniqueIndex('unq_membros_workspace_usuario').on(t.workspaceId, t.usuarioId),
    index('idx_membros_workspace').on(t.workspaceId),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_membros_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_membros_usuarios',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.convidadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_membros_convidador',
    }),
  ],
)

export const convitesWorkspace = mysqlTable(
  'convites_workspace',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    email: varchar('email', { length: 254 }).notNull(),
    funcao: mysqlEnum('funcao', [
      'administrador',
      'gestor',
      'criativo',
      'atendimento',
      'visualizador',
    ]).notNull(),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    convidadoPorUsuarioId: id('convidado_por_usuario_id'),
    aceitoEm: data('aceito_em'),
    expiraEm: data('expira_em').notNull(),
    criadoEm: data('criado_em').notNull(),
    canceladoEm: data('cancelado_em'),
  },
  (t) => [
    uniqueIndex('unq_convites_workspace_token').on(t.tokenHash),
    index('idx_convites_workspace_email').on(t.workspaceId, t.email),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_convites_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.convidadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_convites_usuarios',
    }),
  ],
)

export const clientes = mysqlTable(
  'clientes',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    nome: varchar('nome', { length: 180 }).notNull(),
    empresa: varchar('empresa', { length: 180 }),
    email: varchar('email', { length: 254 }),
    telefone: varchar('telefone', { length: 40 }),
    observacoes: text('observacoes'),
    corIdentificacao: char('cor_identificacao', { length: 7 }),
    status: mysqlEnum('status', ['ativo', 'arquivado']).notNull().default('ativo'),
    criadoPorUsuarioId: id('criado_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_clientes_workspace').on(t.workspaceId),
    index('idx_clientes_nome').on(t.workspaceId, t.nome),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_clientes_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.criadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_clientes_usuarios',
    }),
  ],
)

export const projetos = mysqlTable(
  'projetos',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    clienteId: id('cliente_id'),
    nome: varchar('nome', { length: 200 }).notNull(),
    descricao: text('descricao'),
    tipo: varchar('tipo', { length: 80 }).notNull(),
    status: mysqlEnum('status', [
      'rascunho',
      'em_revisao',
      'alteracoes_solicitadas',
      'aguardando_aprovacao',
      'aprovado',
      'arquivado',
    ])
      .notNull()
      .default('rascunho'),
    prazoEm: data('prazo_em'),
    criadoPorUsuarioId: id('criado_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_projetos_workspace').on(t.workspaceId),
    index('idx_projetos_cliente').on(t.clienteId),
    index('idx_projetos_status').on(t.workspaceId, t.status),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_projetos_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.clienteId],
      foreignColumns: [clientes.id],
      name: 'fk_projetos_clientes',
    }),
    foreignKey({
      columns: [t.criadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_projetos_usuarios',
    }),
  ],
)

export const participantesProjeto = mysqlTable(
  'participantes_projeto',
  {
    id: id().primaryKey(),
    projetoId: id('projeto_id'),
    usuarioId: id('usuario_id'),
    tipoParticipacao: mysqlEnum('tipo_participacao', [
      'responsavel',
      'colaborador',
      'aprovador',
      'visualizador',
    ]).notNull(),
    criadoEm: data('criado_em').notNull(),
    removidoEm: data('removido_em'),
  },
  (t) => [
    uniqueIndex('unq_participantes_projeto_usuario').on(t.projetoId, t.usuarioId),
    foreignKey({
      columns: [t.projetoId],
      foreignColumns: [projetos.id],
      name: 'fk_participantes_projetos',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_participantes_usuarios',
    }).onDelete('cascade'),
  ],
)

export const materiais = mysqlTable(
  'materiais',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    projetoId: id('projeto_id'),
    nome: varchar('nome', { length: 220 }).notNull(),
    tipo: mysqlEnum('tipo', ['imagem', 'video', 'pdf', 'apresentacao', 'pagina_web']).notNull(),
    status: mysqlEnum('status', [
      'rascunho',
      'em_revisao',
      'alteracoes_solicitadas',
      'aguardando_aprovacao',
      'aprovado',
    ])
      .notNull()
      .default('rascunho'),
    versaoAtualId: char('versao_atual_id', { length: 36 }),
    criadoPorUsuarioId: id('criado_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_materiais_workspace').on(t.workspaceId),
    index('idx_materiais_projeto').on(t.projetoId),
    index('idx_materiais_status').on(t.workspaceId, t.status),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_materiais_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.projetoId],
      foreignColumns: [projetos.id],
      name: 'fk_materiais_projetos',
    }),
    foreignKey({
      columns: [t.criadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_materiais_usuarios',
    }),
  ],
)

export const arquivos = mysqlTable(
  'arquivos',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    nomeOriginal: varchar('nome_original', { length: 255 }).notNull(),
    nomeArmazenado: varchar('nome_armazenado', { length: 255 }).notNull(),
    caminhoRelativo: varchar('caminho_relativo', { length: 700 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    extensao: varchar('extensao', { length: 12 }).notNull(),
    tamanhoBytes: bigint('tamanho_bytes', { mode: 'number', unsigned: true }).notNull(),
    largura: int('largura', { unsigned: true }),
    altura: int('altura', { unsigned: true }),
    checksum: char('checksum', { length: 64 }).notNull(),
    criadoPorUsuarioId: id('criado_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_arquivos_workspace').on(t.workspaceId),
    index('idx_arquivos_checksum').on(t.workspaceId, t.checksum),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_arquivos_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.criadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_arquivos_usuarios',
    }),
  ],
)

export const versoesMaterial = mysqlTable(
  'versoes_material',
  {
    id: id().primaryKey(),
    materialId: id('material_id'),
    arquivoId: id('arquivo_id'),
    numero: int('numero', { unsigned: true }).notNull(),
    nome: varchar('nome', { length: 180 }).notNull(),
    descricao: text('descricao'),
    atual: boolean('atual').notNull().default(false),
    aprovada: boolean('aprovada').notNull().default(false),
    criadaPorUsuarioId: id('criada_por_usuario_id'),
    criadoEm: data('criado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    uniqueIndex('unq_versoes_material_numero').on(t.materialId, t.numero),
    index('idx_versoes_material_atual').on(t.materialId, t.atual),
    foreignKey({
      columns: [t.materialId],
      foreignColumns: [materiais.id],
      name: 'fk_versoes_materiais',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.arquivoId],
      foreignColumns: [arquivos.id],
      name: 'fk_versoes_arquivos',
    }),
    foreignKey({
      columns: [t.criadaPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_versoes_usuarios',
    }),
  ],
)

export const comentarios = mysqlTable(
  'comentarios',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    materialId: id('material_id'),
    versaoMaterialId: id('versao_material_id'),
    usuarioId: id('usuario_id'),
    comentarioOrigemId: char('comentario_origem_id', { length: 36 }),
    texto: text('texto').notNull(),
    posicaoX: decimal('posicao_x', { precision: 8, scale: 7 }).notNull(),
    posicaoY: decimal('posicao_y', { precision: 8, scale: 7 }).notNull(),
    status: mysqlEnum('status', ['aberto', 'resolvido']).notNull().default('aberto'),
    resolvidoPorUsuarioId: char('resolvido_por_usuario_id', { length: 36 }),
    resolvidoEm: data('resolvido_em'),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_comentarios_workspace').on(t.workspaceId),
    index('idx_comentarios_versao').on(t.versaoMaterialId),
    index('idx_comentarios_material_status').on(t.materialId, t.status),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_comentarios_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.materialId],
      foreignColumns: [materiais.id],
      name: 'fk_comentarios_materiais',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.versaoMaterialId],
      foreignColumns: [versoesMaterial.id],
      name: 'fk_comentarios_versoes',
    }),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_comentarios_usuarios',
    }),
    foreignKey({
      columns: [t.comentarioOrigemId],
      foreignColumns: [t.id],
      name: 'fk_comentarios_origem',
    }),
    foreignKey({
      columns: [t.resolvidoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_comentarios_resolvidos_usuarios',
    }),
  ],
)

export const respostasComentario = mysqlTable(
  'respostas_comentario',
  {
    id: id().primaryKey(),
    comentarioId: id('comentario_id'),
    usuarioId: id('usuario_id'),
    texto: text('texto').notNull(),
    criadoEm: data('criado_em').notNull(),
    atualizadoEm: data('atualizado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_respostas_comentario').on(t.comentarioId),
    foreignKey({
      columns: [t.comentarioId],
      foreignColumns: [comentarios.id],
      name: 'fk_respostas_comentarios',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_respostas_usuarios',
    }),
  ],
)

export const aprovacoes = mysqlTable(
  'aprovacoes',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    materialId: id('material_id'),
    versaoMaterialId: id('versao_material_id'),
    aprovadoPorUsuarioId: id('aprovado_por_usuario_id'),
    observacao: text('observacao'),
    aprovadoEm: data('aprovado_em').notNull(),
    revogadaEm: data('revogada_em'),
    criadoEm: data('criado_em').notNull(),
  },
  (t) => [
    index('idx_aprovacoes_workspace').on(t.workspaceId),
    index('idx_aprovacoes_material').on(t.materialId),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_aprovacoes_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.materialId],
      foreignColumns: [materiais.id],
      name: 'fk_aprovacoes_materiais',
    }),
    foreignKey({
      columns: [t.versaoMaterialId],
      foreignColumns: [versoesMaterial.id],
      name: 'fk_aprovacoes_versoes',
    }),
    foreignKey({
      columns: [t.aprovadoPorUsuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_aprovacoes_usuarios',
    }),
  ],
)

export const atividades = mysqlTable(
  'atividades',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    usuarioId: id('usuario_id'),
    projetoId: char('projeto_id', { length: 36 }),
    materialId: char('material_id', { length: 36 }),
    versaoMaterialId: char('versao_material_id', { length: 36 }),
    comentarioId: char('comentario_id', { length: 36 }),
    tipo: mysqlEnum('tipo', [
      'cliente_criado',
      'projeto_criado',
      'material_criado',
      'versao_publicada',
      'comentario_criado',
      'comentario_respondido',
      'comentario_resolvido',
      'comentario_reaberto',
      'alteracoes_solicitadas',
      'versao_aprovada',
      'revisao_reaberta',
    ]).notNull(),
    descricao: varchar('descricao', { length: 500 }).notNull(),
    metadados: json('metadados'),
    criadoEm: data('criado_em').notNull(),
  },
  (t) => [
    index('idx_atividades_workspace').on(t.workspaceId, t.criadoEm),
    index('idx_atividades_material').on(t.materialId, t.criadoEm),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_atividades_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_atividades_usuarios',
    }),
    foreignKey({
      columns: [t.projetoId],
      foreignColumns: [projetos.id],
      name: 'fk_atividades_projetos',
    }),
    foreignKey({
      columns: [t.materialId],
      foreignColumns: [materiais.id],
      name: 'fk_atividades_materiais',
    }),
    foreignKey({
      columns: [t.versaoMaterialId],
      foreignColumns: [versoesMaterial.id],
      name: 'fk_atividades_versoes',
    }),
    foreignKey({
      columns: [t.comentarioId],
      foreignColumns: [comentarios.id],
      name: 'fk_atividades_comentarios',
    }),
  ],
)

export const notificacoes = mysqlTable(
  'notificacoes',
  {
    id: id().primaryKey(),
    workspaceId: id('workspace_id'),
    usuarioId: id('usuario_id'),
    atividadeId: id('atividade_id'),
    titulo: varchar('titulo', { length: 180 }).notNull(),
    descricao: varchar('descricao', { length: 500 }).notNull(),
    tipo: varchar('tipo', { length: 80 }).notNull(),
    lidaEm: data('lida_em'),
    criadoEm: data('criado_em').notNull(),
    excluidoEm: data('excluido_em'),
  },
  (t) => [
    index('idx_notificacoes_usuario').on(t.usuarioId, t.criadoEm),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
      name: 'fk_notificacoes_workspaces',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_notificacoes_usuarios',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.atividadeId],
      foreignColumns: [atividades.id],
      name: 'fk_notificacoes_atividades',
    }),
  ],
)

export const tokensVerificacaoEmail = mysqlTable(
  'tokens_verificacao_email',
  {
    id: id().primaryKey(),
    usuarioId: id('usuario_id'),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiraEm: data('expira_em').notNull(),
    utilizadoEm: data('utilizado_em'),
    criadoEm: data('criado_em').notNull(),
  },
  (t) => [
    uniqueIndex('unq_tokens_verificacao_hash').on(t.tokenHash),
    index('idx_tokens_verificacao_usuario').on(t.usuarioId),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_tokens_verificacao_usuarios',
    }).onDelete('cascade'),
  ],
)

export const tokensRecuperacaoSenha = mysqlTable(
  'tokens_recuperacao_senha',
  {
    id: id().primaryKey(),
    usuarioId: id('usuario_id'),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiraEm: data('expira_em').notNull(),
    utilizadoEm: data('utilizado_em'),
    criadoEm: data('criado_em').notNull(),
  },
  (t) => [
    uniqueIndex('unq_tokens_recuperacao_hash').on(t.tokenHash),
    index('idx_tokens_recuperacao_usuario').on(t.usuarioId),
    foreignKey({
      columns: [t.usuarioId],
      foreignColumns: [usuarios.id],
      name: 'fk_tokens_recuperacao_usuarios',
    }).onDelete('cascade'),
  ],
)
