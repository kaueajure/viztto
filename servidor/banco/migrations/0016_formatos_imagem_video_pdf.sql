-- Converte formatos legados para PDF (documento) sem apagar registros.
UPDATE `materiais` SET `tipo` = 'pdf' WHERE `tipo` IN ('apresentacao', 'pagina_web');--> statement-breakpoint
ALTER TABLE `materiais` MODIFY COLUMN `tipo` enum('imagem','video','pdf') NOT NULL;
