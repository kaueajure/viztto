CREATE TABLE `assinaturas` (
	`id` char(36) NOT NULL,
	`workspace_id` char(36) NOT NULL,
	`plano_assinatura_id` char(36) NOT NULL,
	`mercado_pago_assinatura_id` varchar(100),
	`referencia_externa` varchar(120) NOT NULL,
	`email_pagador` varchar(254) NOT NULL,
	`status` enum('pendente','autorizada','pausada','cancelada','erro') NOT NULL DEFAULT 'pendente',
	`ambiente` enum('teste','producao') NOT NULL DEFAULT 'teste',
	`criada_por_usuario_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	CONSTRAINT `assinaturas_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_assinaturas_referencia` UNIQUE(`referencia_externa`),
	CONSTRAINT `unq_assinaturas_mercado_pago` UNIQUE(`mercado_pago_assinatura_id`)
);
--> statement-breakpoint
CREATE TABLE `eventos_webhook_mercado_pago` (
	`id` char(36) NOT NULL,
	`evento_externo_id` varchar(120) NOT NULL,
	`tipo` varchar(80) NOT NULL,
	`acao` varchar(120),
	`recurso_externo_id` varchar(120),
	`assinatura_valida` boolean NOT NULL,
	`processado_em` datetime(3),
	`erro` varchar(500),
	`criado_em` datetime(3) NOT NULL,
	CONSTRAINT `eventos_webhook_mercado_pago_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_eventos_webhook_mp_evento` UNIQUE(`evento_externo_id`)
);
--> statement-breakpoint
CREATE TABLE `planos_assinatura` (
	`id` char(36) NOT NULL,
	`codigo` enum('freelancer','studio','agency') NOT NULL,
	`nome` varchar(80) NOT NULL,
	`descricao` varchar(300) NOT NULL,
	`valor_mensal` decimal(10,2) NOT NULL,
	`moeda` char(3) NOT NULL DEFAULT 'BRL',
	`mercado_pago_plano_id` varchar(100),
	`mercado_pago_status` varchar(40),
	`ativo` boolean NOT NULL DEFAULT true,
	`atualizado_por_usuario_id` char(36),
	`criado_em` datetime(3) NOT NULL,
	`atualizado_em` datetime(3) NOT NULL,
	CONSTRAINT `planos_assinatura_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_planos_assinatura_codigo` UNIQUE(`codigo`),
	CONSTRAINT `unq_planos_assinatura_mercado_pago` UNIQUE(`mercado_pago_plano_id`)
);
--> statement-breakpoint
ALTER TABLE `assinaturas` ADD CONSTRAINT `fk_assinaturas_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assinaturas` ADD CONSTRAINT `fk_assinaturas_planos` FOREIGN KEY (`plano_assinatura_id`) REFERENCES `planos_assinatura`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assinaturas` ADD CONSTRAINT `fk_assinaturas_usuarios` FOREIGN KEY (`criada_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD CONSTRAINT `fk_planos_assinatura_usuarios` FOREIGN KEY (`atualizado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_assinaturas_workspace` ON `assinaturas` (`workspace_id`,`status`);
--> statement-breakpoint
INSERT INTO `planos_assinatura` (`id`, `codigo`, `nome`, `descricao`, `valor_mensal`, `moeda`, `ativo`, `criado_em`, `atualizado_em`) VALUES
('70000000-0000-4000-8000-000000000001', 'freelancer', 'Freelancer', 'Profissionais independentes e pequenos projetos.', 39.00, 'BRL', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('70000000-0000-4000-8000-000000000002', 'studio', 'Studio', 'Pequenas equipes e estudios criativos.', 99.00, 'BRL', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('70000000-0000-4000-8000-000000000003', 'agency', 'Agency', 'Agencias que gerenciam varios clientes.', 199.00, 'BRL', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
