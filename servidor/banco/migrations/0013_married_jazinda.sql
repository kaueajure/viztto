ALTER TABLE `planos_assinatura` MODIFY COLUMN `codigo` enum('gratuito','freelancer','studio','agency') NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` MODIFY COLUMN `plano` enum('gratuito','freelancer','studio','agency') NOT NULL DEFAULT 'gratuito';--> statement-breakpoint
ALTER TABLE `assinaturas` ADD `carencia_ate` datetime(3);--> statement-breakpoint
ALTER TABLE `assinaturas` ADD `vigencia_ate` datetime(3);--> statement-breakpoint
ALTER TABLE `assinaturas` ADD `motivo_status` varchar(80);--> statement-breakpoint
ALTER TABLE `clientes` ADD `portal_configuracao` json;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `beneficios` json NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_projetos_ativos` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_membros` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_clientes` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_armazenamento_gb` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_workspaces` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_identidade_personalizada` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_calendario_editorial` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_relatorios` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_comentarios_imagem` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_comentarios_video` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_comentarios_pdf` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_links_portal_cliente` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_varios_aprovadores` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_historico_avancado` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_prioridade_suporte` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_funcoes_avancadas` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projetos` ADD `token_portal` varchar(64);--> statement-breakpoint
ALTER TABLE `projetos` ADD `portal_configuracao` json;--> statement-breakpoint
ALTER TABLE `projetos` ADD `portal_expira_em` datetime(3);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `portal_configuracao` json;--> statement-breakpoint
ALTER TABLE `projetos` ADD CONSTRAINT `unq_projetos_token_portal` UNIQUE(`token_portal`);