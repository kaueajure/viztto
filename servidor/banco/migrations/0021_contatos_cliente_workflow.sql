-- Contatos externos do Cliente 2 + tipagem de comentários + identidade nas aprovações.
-- Migra aguardando_aprovacao (checklist interno) ? aguardando_revisao.

CREATE TABLE `contatos_cliente` (
  `id` char(36) NOT NULL,
  `workspace_id` char(36) NOT NULL,
  `cliente_id` char(36) NOT NULL,
  `nome` varchar(160) NOT NULL,
  `email` varchar(254) NOT NULL,
  `pode_comentar` boolean NOT NULL DEFAULT true,
  `pode_solicitar_alteracoes` boolean NOT NULL DEFAULT true,
  `pode_aprovar` boolean NOT NULL DEFAULT false,
  `criado_em` datetime(3) NOT NULL,
  `atualizado_em` datetime(3) NOT NULL,
  `excluido_em` datetime(3),
  CONSTRAINT `contatos_cliente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contatos_cliente` ADD CONSTRAINT `fk_contatos_cliente_workspaces` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `contatos_cliente` ADD CONSTRAINT `fk_contatos_cliente_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_contatos_cliente_workspace` ON `contatos_cliente` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `idx_contatos_cliente_cliente` ON `contatos_cliente` (`cliente_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_contatos_cliente_email` ON `contatos_cliente` (`cliente_id`,`email`);
--> statement-breakpoint

ALTER TABLE `comentarios`
  ADD `contato_cliente_id` char(36),
  ADD `autor_externo_email` varchar(254),
  ADD `tipo` enum('comentario','solicitacao_alteracao') NOT NULL DEFAULT 'comentario';
--> statement-breakpoint
ALTER TABLE `comentarios` ADD CONSTRAINT `fk_comentarios_contatos` FOREIGN KEY (`contato_cliente_id`) REFERENCES `contatos_cliente`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_comentarios_contato` ON `comentarios` (`contato_cliente_id`);
--> statement-breakpoint

ALTER TABLE `aprovacoes`
  ADD `contato_cliente_id` char(36),
  ADD `aprovado_por_externo_email` varchar(254);
--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD CONSTRAINT `fk_aprovacoes_contatos` FOREIGN KEY (`contato_cliente_id`) REFERENCES `contatos_cliente`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_aprovacoes_contato` ON `aprovacoes` (`contato_cliente_id`);
--> statement-breakpoint

UPDATE `materiais` SET `status` = 'aguardando_revisao' WHERE `status` = 'aguardando_aprovacao';
--> statement-breakpoint
UPDATE `projetos` SET `status` = 'aguardando_revisao' WHERE `status` = 'aguardando_aprovacao';
