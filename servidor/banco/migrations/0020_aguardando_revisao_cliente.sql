-- Aprovacao final e exclusiva do Cliente 2 (portal).
-- `em_revisao` passa a se chamar `aguardando_revisao` (versao publicada aguardando o cliente).
-- Atividade `enviado_para_aprovacao` registra o envio interno sem marcar o material como aprovado.

ALTER TABLE `materiais`
  MODIFY COLUMN `status` enum(
    'rascunho',
    'em_revisao',
    'aguardando_revisao',
    'alteracoes_solicitadas',
    'aguardando_aprovacao',
    'aprovado'
  ) NOT NULL DEFAULT 'rascunho';
--> statement-breakpoint
UPDATE `materiais` SET `status` = 'aguardando_revisao' WHERE `status` = 'em_revisao';
--> statement-breakpoint
ALTER TABLE `materiais`
  MODIFY COLUMN `status` enum(
    'rascunho',
    'aguardando_revisao',
    'alteracoes_solicitadas',
    'aguardando_aprovacao',
    'aprovado'
  ) NOT NULL DEFAULT 'rascunho';
--> statement-breakpoint
ALTER TABLE `projetos`
  MODIFY COLUMN `status` enum(
    'rascunho',
    'em_andamento',
    'em_revisao',
    'aguardando_revisao',
    'alteracoes_solicitadas',
    'aguardando_aprovacao',
    'aprovado',
    'arquivado'
  ) NOT NULL DEFAULT 'rascunho';
--> statement-breakpoint
UPDATE `projetos` SET `status` = 'aguardando_revisao' WHERE `status` = 'em_revisao';
--> statement-breakpoint
ALTER TABLE `projetos`
  MODIFY COLUMN `status` enum(
    'rascunho',
    'em_andamento',
    'aguardando_revisao',
    'alteracoes_solicitadas',
    'aguardando_aprovacao',
    'aprovado',
    'arquivado'
  ) NOT NULL DEFAULT 'rascunho';
--> statement-breakpoint
ALTER TABLE `atividades`
  MODIFY COLUMN `tipo` enum(
    'cliente_criado',
    'projeto_criado',
    'material_criado',
    'versao_publicada',
    'comentario_criado',
    'comentario_respondido',
    'comentario_resolvido',
    'comentario_reaberto',
    'alteracoes_solicitadas',
    'aprovacao_parcial',
    'enviado_para_aprovacao',
    'versao_aprovada',
    'revisao_reaberta'
  ) NOT NULL;
