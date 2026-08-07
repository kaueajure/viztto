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
  CAST('["2 projetos ativos","2 GB de armazenamento","1 pessoa na equipe","Links para clientes","Coment\\u00e1rios em imagens e PDFs"]' AS JSON),
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
SET `beneficios` = CAST('["5 projetos ativos","10 GB de armazenamento","Coment\\u00e1rios em imagens e PDFs","Coment\\u00e1rios em v\\u00eddeo","Links para clientes","Hist\\u00f3rico de vers\\u00f5es"]' AS JSON)
WHERE `codigo` = 'freelancer';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = CAST('["25 projetos ativos","100 GB de armazenamento","At\\u00e9 5 pessoas na equipe","V\\u00e1rios aprovadores","Identidade personalizada","Calend\\u00e1rio editorial","Relat\\u00f3rios b\\u00e1sicos"]' AS JSON)
WHERE `codigo` = 'studio';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = CAST('["Projetos ativos ampliados","500 GB de armazenamento","At\\u00e9 15 pessoas na equipe","Espa\\u00e7os separados por cliente","Portal personalizado","Permiss\\u00f5es","Prioridade no suporte","Hist\\u00f3rico avan\\u00e7ado"]' AS JSON)
WHERE `codigo` = 'agency';--> statement-breakpoint
UPDATE `planos_assinatura`
SET `beneficios` = CAST('["2 projetos ativos","2 GB de armazenamento","1 pessoa na equipe","Links para clientes","Coment\\u00e1rios em imagens e PDFs"]' AS JSON),
    `descricao` = 'Para comecar e validar o fluxo com limites basicos.'
WHERE `codigo` = 'gratuito';
