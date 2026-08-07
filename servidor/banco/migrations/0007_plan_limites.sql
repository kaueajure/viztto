ALTER TABLE `planos_assinatura` ADD `beneficios` json;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_projetos_ativos` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_membros` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_clientes` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_armazenamento_gb` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `max_workspaces` int;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_identidade_personalizada` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_portal_white_label` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_calendario_editorial` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_relatorios` boolean NOT NULL DEFAULT false;--> statement-breakpoint
UPDATE `planos_assinatura`
SET
  `beneficios` = CAST('["5 projetos ativos","10 GB de armazenamento","Coment\\u00e1rios em imagens e PDFs","Coment\\u00e1rios em v\\u00eddeo","Links para clientes","Hist\\u00f3rico de vers\\u00f5es"]' AS JSON),
  `max_projetos_ativos` = 5,
  `max_membros` = 1,
  `max_clientes` = 10,
  `max_armazenamento_gb` = 10,
  `max_workspaces` = 1,
  `permite_identidade_personalizada` = false,
  `permite_portal_white_label` = false,
  `permite_calendario_editorial` = false,
  `permite_relatorios` = false
WHERE `codigo` = 'freelancer';--> statement-breakpoint
UPDATE `planos_assinatura`
SET
  `beneficios` = CAST('["25 projetos ativos","100 GB de armazenamento","At\\u00e9 5 pessoas na equipe","V\\u00e1rios aprovadores","Identidade personalizada","Calend\\u00e1rio editorial","Relat\\u00f3rios b\\u00e1sicos"]' AS JSON),
  `max_projetos_ativos` = 25,
  `max_membros` = 5,
  `max_clientes` = 50,
  `max_armazenamento_gb` = 100,
  `max_workspaces` = 1,
  `permite_identidade_personalizada` = true,
  `permite_portal_white_label` = false,
  `permite_calendario_editorial` = true,
  `permite_relatorios` = true
WHERE `codigo` = 'studio';--> statement-breakpoint
UPDATE `planos_assinatura`
SET
  `beneficios` = CAST('["Projetos ativos ampliados","500 GB de armazenamento","At\\u00e9 15 pessoas na equipe","Espa\\u00e7os separados por cliente","Portal personalizado","Permiss\\u00f5es","Prioridade no suporte","Hist\\u00f3rico avan\\u00e7ado"]' AS JSON),
  `max_projetos_ativos` = NULL,
  `max_membros` = 15,
  `max_clientes` = NULL,
  `max_armazenamento_gb` = 500,
  `max_workspaces` = 10,
  `permite_identidade_personalizada` = true,
  `permite_portal_white_label` = true,
  `permite_calendario_editorial` = true,
  `permite_relatorios` = true
WHERE `codigo` = 'agency';--> statement-breakpoint
UPDATE `planos_assinatura` SET `beneficios` = CAST('[]' AS JSON) WHERE `beneficios` IS NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` MODIFY `beneficios` json NOT NULL;
