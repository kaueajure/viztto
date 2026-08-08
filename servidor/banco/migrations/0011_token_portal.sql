ALTER TABLE `projetos` ADD `token_portal` varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX `unq_projetos_token_portal` ON `projetos` (`token_portal`);
