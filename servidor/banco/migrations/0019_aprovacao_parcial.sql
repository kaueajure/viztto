-- Distingue aprovação parcial (ainda faltam aprovadores) de aprovação final da versão.
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
    'versao_aprovada',
    'revisao_reaberta'
  ) NOT NULL;
