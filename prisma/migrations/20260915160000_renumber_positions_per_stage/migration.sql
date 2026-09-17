-- Ao unir os quadros Nacional e Internacional, cada raia herdou duas sequências
-- independentes de "position" (ambas começando em 1024 com passo 1024), o que
-- deixou cards empatados: ordem instável entre recargas e arraste que não
-- persiste (ponto médio de dois valores iguais é o mesmo valor).
--
-- Renumera por etapa preservando a ordem atual (position, depois data de
-- criação). Inclui os cards arquivados para que nenhum valor fique duplicado
-- quando um deles for desarquivado.
UPDATE "applications" AS a
SET "position" = r.rn * 1024
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "stageId"
      ORDER BY "position", "createdAt", id
    ) AS rn
  FROM "applications"
) AS r
WHERE a.id = r.id;
