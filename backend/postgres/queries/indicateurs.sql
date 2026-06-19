-- name: UpsertIndicateurObservations :batchexec
INSERT INTO app.indicateur_observations (
    key,
    reference,
    data
) VALUES (
    @key,
    @reference,
    @data
)
ON CONFLICT (key, reference) DO UPDATE SET
    data       = EXCLUDED.data;

-- name: ListIndicateurs :many
-- Renvoie une ligne par `key` avec ses métadonnées agrégées.
-- `last_reference` est la reference lexicographiquement max — convention :
-- tout calculator doit produire des references triables (YYYY, YYYY-MM,
-- YYYY-MM-DD, ou un timestamp ISO).
SELECT
    key,
    COUNT(*)::bigint                   AS observations_count,
    MAX(reference)::text               AS last_reference,
    MIN(reference)::text               AS first_reference,
    MAX(updated_at)::timestamptz       AS last_updated_at
FROM app.indicateur_observations
GROUP BY key
ORDER BY key;

-- name: ListIndicateurObservationsByKey :many
-- Renvoie toutes les observations d'un indicateur, triées par reference
-- ascendante (= ordre chronologique si la convention de naming est respectée).
SELECT * FROM app.indicateur_observations
WHERE key = $1
ORDER BY reference ASC;