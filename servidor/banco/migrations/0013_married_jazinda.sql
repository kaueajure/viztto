ALTER TABLE `clientes` ADD `portal_configuracao` json;--> statement-breakpoint
ALTER TABLE `projetos` ADD `portal_configuracao` json;--> statement-breakpoint
ALTER TABLE `projetos` ADD `portal_expira_em` datetime(3);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `portal_configuracao` json;
