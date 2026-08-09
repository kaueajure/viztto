UPDATE `projetos`
SET
  `portal_expira_em` = NULL,
  `token_portal` = NULL
WHERE `portal_expira_em` IS NOT NULL
  AND `portal_expira_em` < '2000-01-01 00:00:00.000';
