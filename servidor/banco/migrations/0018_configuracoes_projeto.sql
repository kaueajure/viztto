-- Configurações avançadas do projeto: datas, modo de aprovação, portal e métricas de link.
ALTER TABLE `projetos`
  ADD COLUMN `data_inicio` datetime(3) NULL,
  ADD COLUMN `modo_aprovacao` enum('qualquer','todos') NOT NULL DEFAULT 'qualquer',
  ADD COLUMN `portal_ativo` boolean NOT NULL DEFAULT true,
  ADD COLUMN `portal_criado_em` datetime(3) NULL,
  ADD COLUMN `portal_acessos` int NOT NULL DEFAULT 0,
  ADD COLUMN `portal_ultimo_acesso_em` datetime(3) NULL;--> statement-breakpoint
ALTER TABLE `projetos`
  MODIFY COLUMN `status` enum(
    'rascunho',
    'em_andamento',
    'em_revisao',
    'alteracoes_solicitadas',
    'aguardando_aprovacao',
    'aprovado',
    'arquivado'
  ) NOT NULL DEFAULT 'rascunho';--> statement-breakpoint
ALTER TABLE `participantes_projeto`
  ADD COLUMN `pode_enviar_materiais` boolean NOT NULL DEFAULT true,
  ADD COLUMN `pode_responder_comentarios` boolean NOT NULL DEFAULT true;--> statement-breakpoint
UPDATE `projetos`
SET `portal_criado_em` = `criado_em`
WHERE `token_portal` IS NOT NULL AND `portal_criado_em` IS NULL;
