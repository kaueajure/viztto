-- Remove do switch admin os workspaces gerados pelos testes E2E (mantém o registro soft-deleted).
UPDATE `workspaces`
SET
  `excluido_em` = CURRENT_TIMESTAMP(3),
  `ativo` = 0,
  `atualizado_em` = CURRENT_TIMESTAMP(3)
WHERE `slug` LIKE 'e2e-%'
  AND `excluido_em` IS NULL;
