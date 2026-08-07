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
  `beneficios` = JSON_ARRAY(
    '5 projetos ativos',
    '10 GB de armazenamento',
    CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em imagens e PDFs'),
    CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em v', CONVERT(UNHEX('C3AD') USING utf8mb4), 'deo'),
    'Links para clientes',
    CONCAT('Hist', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rico de vers', CONVERT(UNHEX('C3B5') USING utf8mb4), 'es')
  ),
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
  `beneficios` = JSON_ARRAY(
    '25 projetos ativos',
    '100 GB de armazenamento',
    CONCAT('At', CONVERT(UNHEX('C3A9') USING utf8mb4), ' 5 pessoas na equipe'),
    CONCAT('V', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios aprovadores'),
    'Identidade personalizada',
    CONCAT('Calend', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rio editorial'),
    CONCAT('Relat', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rios b', CONVERT(UNHEX('C3A1') USING utf8mb4), 'sicos')
  ),
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
  `beneficios` = JSON_ARRAY(
    'Projetos ativos ampliados',
    '500 GB de armazenamento',
    CONCAT('At', CONVERT(UNHEX('C3A9') USING utf8mb4), ' 15 pessoas na equipe'),
    CONCAT('Espa', CONVERT(UNHEX('C3A7') USING utf8mb4), 'os separados por cliente'),
    'Portal personalizado',
    CONCAT('Permiss', CONVERT(UNHEX('C3B5') USING utf8mb4), 'es'),
    'Prioridade no suporte',
    CONCAT('Hist', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rico avan', CONVERT(UNHEX('C3A7') USING utf8mb4), 'ado')
  ),
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
UPDATE `planos_assinatura` SET `beneficios` = JSON_ARRAY() WHERE `beneficios` IS NULL;--> statement-breakpoint
ALTER TABLE `planos_assinatura` MODIFY `beneficios` json NOT NULL;
