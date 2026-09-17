-- Unificação do quadro: fim da seção Nacional/Internacional.
-- País (countryCode, ISO-3166 alpha-2) passa a ser a única dimensão geográfica;
-- "Brasil × exterior" é derivado de countryCode = 'BR'.

-- 1) Backfill: vagas nacionais nunca tiveram país gravado (as actions forçavam NULL).
UPDATE "applications" SET "countryCode" = 'BR' WHERE "section" = 'NACIONAL';

-- 2) Defensivo: internacionais sempre tiveram país validado na criação/edição,
--    mas qualquer resíduo nulo faria o SET NOT NULL falhar no deploy.
UPDATE "applications" SET "countryCode" = 'BR' WHERE "countryCode" IS NULL;

-- 3) Remove a seção (índice composto, coluna e enum).
DROP INDEX "applications_section_stageId_idx";
ALTER TABLE "applications" DROP COLUMN "section";
DROP TYPE "Section";

-- 4) País obrigatório e índice por etapa (o quadro agora é único).
ALTER TABLE "applications" ALTER COLUMN "countryCode" SET NOT NULL;
CREATE INDEX "applications_stageId_idx" ON "applications"("stageId");
