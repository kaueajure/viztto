ALTER TABLE `workspaces` MODIFY `plano` enum('gratuito','freelancer','studio','agency') NOT NULL DEFAULT 'gratuito';--> statement-breakpoint
ALTER TABLE `planos_assinatura` MODIFY `codigo` enum('gratuito','freelancer','studio','agency') NOT NULL;--> statement-breakpoint
INSERT INTO `planos_assinatura` (
  `id`, `codigo`, `nome`, `descricao`, `valor_mensal`, `moeda`, `beneficios`,
  `max_projetos_ativos`, `max_membros`, `max_clientes`, `max_armazenamento_gb`, `max_workspaces`,
  `permite_identidade_personalizada`, `permite_portal_white_label`, `permite_calendario_editorial`, `permite_relatorios`,
  `ativo`, `criado_em`, `atualizado_em`
) VALUES (
  '70000000-0000-4000-8000-000000000000',
  'gratuito',
  'Gratuito',
  'Para comecar e validar o fluxo com limites basicos.',
  0.00,
  'BRL',
  JSON_ARRAY(
    '2 projetos ativos',
    '2 GB de armazenamento',
    '1 pessoa na equipe',
    'Links para clientes',
    CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em imagens e PDFs')
  ),
  2, 1, 3, 2, 1,
  false, false, false, false,
  true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
) ON DUPLICATE KEY UPDATE
  `nome` = VALUES(`nome`),
  `descricao` = VALUES(`descricao`),
  `valor_mensal` = VALUES(`valor_mensal`),
  `beneficios` = VALUES(`beneficios`),
  `max_projetos_ativos` = VALUES(`max_projetos_ativos`),
  `max_membros` = VALUES(`max_membros`),
  `max_clientes` = VALUES(`max_clientes`),
  `max_armazenamento_gb` = VALUES(`max_armazenamento_gb`),
  `max_workspaces` = VALUES(`max_workspaces`),
  `permite_identidade_personalizada` = VALUES(`permite_identidade_personalizada`),
  `permite_portal_white_label` = VALUES(`permite_portal_white_label`),
  `permite_calendario_editorial` = VALUES(`permite_calendario_editorial`),
  `permite_relatorios` = VALUES(`permite_relatorios`),
  `atualizado_em` = CURRENT_TIMESTAMP(3);--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = JSON_ARRAY(
  '5 projetos ativos',
  '10 GB de armazenamento',
  CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em imagens e PDFs'),
  CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em v', CONVERT(UNHEX('C3AD') USING utf8mb4), 'deo'),
  'Links para clientes',
  CONCAT('Hist', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rico de vers', CONVERT(UNHEX('C3B5') USING utf8mb4), 'es')
)
WHERE `codigo` = 'freelancer';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = JSON_ARRAY(
  '25 projetos ativos',
  '100 GB de armazenamento',
  CONCAT('At', CONVERT(UNHEX('C3A9') USING utf8mb4), ' 5 pessoas na equipe'),
  CONCAT('V', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios aprovadores'),
  'Identidade personalizada',
  CONCAT('Calend', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rio editorial'),
  CONCAT('Relat', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rios b', CONVERT(UNHEX('C3A1') USING utf8mb4), 'sicos')
)
WHERE `codigo` = 'studio';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = JSON_ARRAY(
  'Projetos ativos ampliados',
  '500 GB de armazenamento',
  CONCAT('At', CONVERT(UNHEX('C3A9') USING utf8mb4), ' 15 pessoas na equipe'),
  CONCAT('Espa', CONVERT(UNHEX('C3A7') USING utf8mb4), 'os separados por cliente'),
  'Portal personalizado',
  CONCAT('Permiss', CONVERT(UNHEX('C3B5') USING utf8mb4), 'es'),
  'Prioridade no suporte',
  CONCAT('Hist', CONVERT(UNHEX('C3B3') USING utf8mb4), 'rico avan', CONVERT(UNHEX('C3A7') USING utf8mb4), 'ado')
)
WHERE `codigo` = 'agency';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = JSON_ARRAY(
  '2 projetos ativos',
  '2 GB de armazenamento',
  '1 pessoa na equipe',
  'Links para clientes',
  CONCAT('Coment', CONVERT(UNHEX('C3A1') USING utf8mb4), 'rios em imagens e PDFs')
)
WHERE `codigo` = 'gratuito';
