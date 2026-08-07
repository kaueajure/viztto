ALTER TABLE `planos_assinatura` ADD `permite_comentarios_imagem` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_comentarios_video` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_comentarios_pdf` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_links_portal_cliente` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_varios_aprovadores` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_historico_avancado` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_prioridade_suporte` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `planos_assinatura` ADD `permite_funcoes_avancadas` boolean NOT NULL DEFAULT false;--> statement-breakpoint
UPDATE `planos_assinatura` SET
  `permite_comentarios_imagem` = true,
  `permite_comentarios_video` = false,
  `permite_comentarios_pdf` = true,
  `permite_links_portal_cliente` = true,
  `permite_varios_aprovadores` = false,
  `permite_historico_avancado` = false,
  `permite_prioridade_suporte` = false,
  `permite_funcoes_avancadas` = false
WHERE `codigo` = 'gratuito';--> statement-breakpoint
UPDATE `planos_assinatura` SET
  `permite_comentarios_imagem` = true,
  `permite_comentarios_video` = true,
  `permite_comentarios_pdf` = true,
  `permite_links_portal_cliente` = true,
  `permite_varios_aprovadores` = false,
  `permite_historico_avancado` = false,
  `permite_prioridade_suporte` = false,
  `permite_funcoes_avancadas` = false
WHERE `codigo` = 'freelancer';--> statement-breakpoint
UPDATE `planos_assinatura` SET
  `permite_comentarios_imagem` = true,
  `permite_comentarios_video` = true,
  `permite_comentarios_pdf` = true,
  `permite_links_portal_cliente` = true,
  `permite_varios_aprovadores` = true,
  `permite_historico_avancado` = false,
  `permite_prioridade_suporte` = false,
  `permite_funcoes_avancadas` = true,
  `max_workspaces` = GREATEST(IFNULL(`max_workspaces`, 1), 3)
WHERE `codigo` = 'studio';--> statement-breakpoint
UPDATE `planos_assinatura` SET
  `permite_comentarios_imagem` = true,
  `permite_comentarios_video` = true,
  `permite_comentarios_pdf` = true,
  `permite_links_portal_cliente` = true,
  `permite_varios_aprovadores` = true,
  `permite_historico_avancado` = true,
  `permite_prioridade_suporte` = true,
  `permite_funcoes_avancadas` = true
WHERE `codigo` = 'agency';
