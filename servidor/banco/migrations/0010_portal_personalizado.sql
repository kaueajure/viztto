UPDATE `planos_assinatura`
SET `permite_identidade_personalizada` = true
WHERE `permite_portal_white_label` = true;--> statement-breakpoint
ALTER TABLE `planos_assinatura` DROP COLUMN `permite_portal_white_label`;
