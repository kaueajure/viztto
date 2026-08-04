CREATE TABLE `aprovacoes` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`material_id` char(36) NOT NULL,
	`versao_material_id` char(36) NOT NULL,
	`aprovado_por_usuario_id` char(36) NOT NULL,
	`observacao` text,
	`aprovado_em` datetime(3) NOT NULL,
	`revogada_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	CONSTRAINT `aprovacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arquivos` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`nome_original` varchar(255) NOT NULL,
	`nome_armazenado` varchar(255) NOT NULL,
	`caminho_relativo` varchar(700) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`extensao` varchar(12) NOT NULL,
	`tamanho_bytes` bigint unsigned NOT NULL,
	`largura` int unsigned,
	`altura` int unsigned,
	`checksum` char(64) NOT NULL,
	`criado_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `arquivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atividades` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`projeto_id` char(36),
	`material_id` char(36),
	`versao_material_id` char(36),
	`comentario_id` char(36),
	`tipo` enum('cliente_criado','projeto_criado','material_criado','versao_publicada','comentario_criado','comentario_respondido','comentario_resolvido','comentario_reaberto','alteracoes_solicitadas','versao_aprovada','revisao_reaberta') NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`metadados` json,
	`criado_em` datetime(3) NOT NULL,
	CONSTRAINT `atividades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`nome` varchar(180) NOT NULL,
	`empresa` varchar(180),
	`email` varchar(254),
	`telefone` varchar(40),
	`observacoes` text,
	`cor_identificacao` char(7),
	`status` enum('ativo','arquivado') NOT NULL DEFAULT 'ativo',
	`criado_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comentarios` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`material_id` char(36) NOT NULL,
	`versao_material_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`comentario_origem_id` char(36),
	`texto` text NOT NULL,
	`posicao_x` decimal(8,7) NOT NULL,
	`posicao_y` decimal(8,7) NOT NULL,
	`status` enum('aberto','resolvido') NOT NULL DEFAULT 'aberto',
	`resolvido_por_usuario_id` char(36),
	`resolvido_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `comentarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `convites_workspace` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`funcao` enum('administrador','gestor','criativo','atendimento','visualizador') NOT NULL,
	`token_hash` char(64) NOT NULL,
	`convidado_por_usuario_id` char(36) NOT NULL,
	`aceito_em` datetime(3),
	`expira_em` datetime(3) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`cancelado_em` datetime(3),
	CONSTRAINT `convites_workspace_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_convites_workspace_token` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `materiais` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`projeto_id` char(36) NOT NULL,
	`nome` varchar(220) NOT NULL,
	`tipo` enum('imagem','video','pdf','apresentacao','pagina_web') NOT NULL,
	`status` enum('rascunho','em_revisao','alteracoes_solicitadas','aguardando_aprovacao','aprovado') NOT NULL DEFAULT 'rascunho',
	`versao_atual_id` char(36),
	`criado_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `materiais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membros_workspace` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`funcao` enum('administrador','gestor','criativo','atendimento','visualizador') NOT NULL,
	`status` enum('ativo','convidado','suspenso') NOT NULL DEFAULT 'ativo',
	`convidado_por_usuario_id` char(36),
	`entrou_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	CONSTRAINT `membros_workspace_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_membros_workspace_usuario` UNIQUE(`workspace_id`,`usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`atividade_id` char(36) NOT NULL,
	`titulo` varchar(180) NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`tipo` varchar(80) NOT NULL,
	`lida_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participantes_projeto` (
	`id` char(36) NOT NULL,
	`projeto_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`tipo_participacao` enum('responsavel','colaborador','aprovador','visualizador') NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`removido_em` datetime(3),
	CONSTRAINT `participantes_projeto_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_participantes_projeto_usuario` UNIQUE(`projeto_id`,`usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `projetos` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`cliente_id` char(36) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`descricao` text,
	`tipo` varchar(80) NOT NULL,
	`status` enum('rascunho','em_revisao','alteracoes_solicitadas','aguardando_aprovacao','aprovado','arquivado') NOT NULL DEFAULT 'rascunho',
	`prazo_em` datetime(3),
	`criado_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `projetos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `respostas_comentario` (
	`id` char(36) NOT NULL,
	`comentario_id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`texto` text NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `respostas_comentario_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`endereco_ip` varchar(64),
	`agente_usuario` varchar(500),
	`expira_em` datetime(3) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`revogado_em` datetime(3),
	CONSTRAINT `sessoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_sessoes_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `tokens_recuperacao_senha` (
	`id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expira_em` datetime(3) NOT NULL,
	`utilizado_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	CONSTRAINT `tokens_recuperacao_senha_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_tokens_recuperacao_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `tokens_verificacao_email` (
	`id` char(36) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expira_em` datetime(3) NOT NULL,
	`utilizado_em` datetime(3),
	`criado_em` datetime(3) NOT NULL,
	CONSTRAINT `tokens_verificacao_email_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_tokens_verificacao_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` char(36) NOT NULL,
	`nome` varchar(160) NOT NULL,
	`email` varchar(254) NOT NULL,
	`senha_hash` varchar(255) NOT NULL,
	`avatar_url` varchar(500),
	`email_verificado_em` datetime(3),
	`ultimo_acesso_em` datetime(3),
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_usuarios_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `versoes_material` (
	`id` char(36) NOT NULL,
	`material_id` char(36) NOT NULL,
	`arquivo_id` char(36) NOT NULL,
	`numero` int unsigned NOT NULL,
	`nome` varchar(180) NOT NULL,
	`descricao` text,
	`atual` boolean NOT NULL DEFAULT false,
	`aprovada` boolean NOT NULL DEFAULT false,
	`criada_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `versoes_material_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_versoes_material_numero` UNIQUE(`material_id`,`numero`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` char(36) NOT NULL,
	`nome` varchar(160) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`plano` enum('freelancer','studio','agency') NOT NULL DEFAULT 'freelancer',
	`logo_url` varchar(500),
	`cor_principal` char(7) NOT NULL DEFAULT '#b8ff4f',
	`ativo` boolean NOT NULL DEFAULT true,
	`criado_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	`excluido_em` datetime(3),
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_workspaces_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD CONSTRAINT `fk_aprovacoes_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD CONSTRAINT `fk_aprovacoes_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD CONSTRAINT `fk_aprovacoes_versoes` FOREIGN KEY (`versao_material_id`) REFERENCES `versoes_material`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD CONSTRAINT `fk_aprovacoes_usuarios` FOREIGN KEY (`aprovado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `arquivos` ADD CONSTRAINT `fk_arquivos_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `arquivos` ADD CONSTRAINT `fk_arquivos_usuarios` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_projetos` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_versoes` FOREIGN KEY (`versao_material_id`) REFERENCES `versoes_material`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `atividades` ADD CONSTRAINT `fk_atividades_comentarios` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientes` ADD CONSTRAINT `fk_clientes_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientes` ADD CONSTRAINT `fk_clientes_usuarios` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_versoes` FOREIGN KEY (`versao_material_id`) REFERENCES `versoes_material`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_origem` FOREIGN KEY (`comentario_origem_id`) REFERENCES `comentarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_resolvidos_usuarios` FOREIGN KEY (`resolvido_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `convites_workspace` ADD CONSTRAINT `fk_convites_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `convites_workspace` ADD CONSTRAINT `fk_convites_usuarios` FOREIGN KEY (`convidado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materiais` ADD CONSTRAINT `fk_materiais_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materiais` ADD CONSTRAINT `fk_materiais_projetos` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materiais` ADD CONSTRAINT `fk_materiais_usuarios` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membros_workspace` ADD CONSTRAINT `fk_membros_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membros_workspace` ADD CONSTRAINT `fk_membros_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membros_workspace` ADD CONSTRAINT `fk_membros_convidador` FOREIGN KEY (`convidado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificacoes` ADD CONSTRAINT `fk_notificacoes_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificacoes` ADD CONSTRAINT `fk_notificacoes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificacoes` ADD CONSTRAINT `fk_notificacoes_atividades` FOREIGN KEY (`atividade_id`) REFERENCES `atividades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participantes_projeto` ADD CONSTRAINT `fk_participantes_projetos` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participantes_projeto` ADD CONSTRAINT `fk_participantes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projetos` ADD CONSTRAINT `fk_projetos_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projetos` ADD CONSTRAINT `fk_projetos_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projetos` ADD CONSTRAINT `fk_projetos_usuarios` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respostas_comentario` ADD CONSTRAINT `fk_respostas_comentarios` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `respostas_comentario` ADD CONSTRAINT `fk_respostas_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessoes` ADD CONSTRAINT `fk_sessoes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokens_recuperacao_senha` ADD CONSTRAINT `fk_tokens_recuperacao_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokens_verificacao_email` ADD CONSTRAINT `fk_tokens_verificacao_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `versoes_material` ADD CONSTRAINT `fk_versoes_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `versoes_material` ADD CONSTRAINT `fk_versoes_arquivos` FOREIGN KEY (`arquivo_id`) REFERENCES `arquivos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `versoes_material` ADD CONSTRAINT `fk_versoes_usuarios` FOREIGN KEY (`criada_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `fk_workspaces_usuarios` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_aprovacoes_workspace` ON `aprovacoes` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_aprovacoes_material` ON `aprovacoes` (`material_id`);--> statement-breakpoint
CREATE INDEX `idx_arquivos_workspace` ON `arquivos` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_arquivos_checksum` ON `arquivos` (`workspace_id`,`checksum`);--> statement-breakpoint
CREATE INDEX `idx_atividades_workspace` ON `atividades` (`workspace_id`,`criado_em`);--> statement-breakpoint
CREATE INDEX `idx_atividades_material` ON `atividades` (`material_id`,`criado_em`);--> statement-breakpoint
CREATE INDEX `idx_clientes_workspace` ON `clientes` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_clientes_nome` ON `clientes` (`workspace_id`,`nome`);--> statement-breakpoint
CREATE INDEX `idx_comentarios_workspace` ON `comentarios` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_comentarios_versao` ON `comentarios` (`versao_material_id`);--> statement-breakpoint
CREATE INDEX `idx_comentarios_material_status` ON `comentarios` (`material_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_convites_workspace_email` ON `convites_workspace` (`workspace_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_materiais_workspace` ON `materiais` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_materiais_projeto` ON `materiais` (`projeto_id`);--> statement-breakpoint
CREATE INDEX `idx_materiais_status` ON `materiais` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_membros_workspace` ON `membros_workspace` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_notificacoes_usuario` ON `notificacoes` (`usuario_id`,`criado_em`);--> statement-breakpoint
CREATE INDEX `idx_projetos_workspace` ON `projetos` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_projetos_cliente` ON `projetos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `idx_projetos_status` ON `projetos` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_respostas_comentario` ON `respostas_comentario` (`comentario_id`);--> statement-breakpoint
CREATE INDEX `idx_sessoes_usuario` ON `sessoes` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_sessoes_expiracao` ON `sessoes` (`expira_em`);--> statement-breakpoint
CREATE INDEX `idx_tokens_recuperacao_usuario` ON `tokens_recuperacao_senha` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_tokens_verificacao_usuario` ON `tokens_verificacao_email` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_usuarios_ativo` ON `usuarios` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_versoes_material_atual` ON `versoes_material` (`material_id`,`atual`);--> statement-breakpoint
CREATE INDEX `idx_workspaces_ativo` ON `workspaces` (`ativo`);
--> statement-breakpoint
ALTER TABLE `materiais` ADD CONSTRAINT `fk_materiais_versoes` FOREIGN KEY (`versao_atual_id`) REFERENCES `versoes_material`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE `usuarios` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `sessoes` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `workspaces` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `membros_workspace` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `convites_workspace` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `clientes` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `projetos` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `participantes_projeto` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `materiais` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `arquivos` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `versoes_material` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `comentarios` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `respostas_comentario` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `aprovacoes` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `atividades` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `notificacoes` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `tokens_verificacao_email` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `tokens_recuperacao_senha` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
