CREATE TABLE `preferencias_usuario` (
	`usuario_id` char(36) NOT NULL,
	`comentarios` boolean NOT NULL DEFAULT true,
	`alteracoes` boolean NOT NULL DEFAULT true,
	`aprovacoes` boolean NOT NULL DEFAULT true,
	`prazos` boolean NOT NULL DEFAULT true,
	`email` boolean NOT NULL DEFAULT true,
	`sistema` boolean NOT NULL DEFAULT true,
	`atualizado_em` datetime(3) NOT NULL,
	CONSTRAINT `preferencias_usuario_usuario_id` PRIMARY KEY(`usuario_id`)
);
--> statement-breakpoint
ALTER TABLE `usuarios` ADD `termos_aceitos_em` datetime(3);--> statement-breakpoint
ALTER TABLE `usuarios` ADD `versao_termos` varchar(20);--> statement-breakpoint
ALTER TABLE `preferencias_usuario` ADD CONSTRAINT `fk_preferencias_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;