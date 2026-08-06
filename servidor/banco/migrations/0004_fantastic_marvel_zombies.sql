ALTER TABLE `aprovacoes` MODIFY COLUMN `aprovado_por_usuario_id` char(36);--> statement-breakpoint
ALTER TABLE `atividades` MODIFY COLUMN `usuario_id` char(36);--> statement-breakpoint
ALTER TABLE `comentarios` MODIFY COLUMN `usuario_id` char(36);--> statement-breakpoint
ALTER TABLE `aprovacoes` ADD `aprovado_por_externo_nome` varchar(160);--> statement-breakpoint
ALTER TABLE `comentarios` ADD `autor_externo_nome` varchar(160);