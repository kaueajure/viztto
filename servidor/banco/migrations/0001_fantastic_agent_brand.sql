ALTER TABLE `sessoes` ADD `workspace_ativo_id` char(36);--> statement-breakpoint
ALTER TABLE `usuarios` ADD `admin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sessoes` ADD CONSTRAINT `fk_sessoes_workspace_ativo` FOREIGN KEY (`workspace_ativo_id`) REFERENCES `workspaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_sessoes_workspace_ativo` ON `sessoes` (`workspace_ativo_id`);