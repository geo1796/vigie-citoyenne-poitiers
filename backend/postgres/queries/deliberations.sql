-- name: UpsertDeliberations :batchexec
INSERT INTO app.deliberations (
    delib_id,
    collectivite,
    instance,
    coll_nom,
    coll_siret,
    delib_date,
    delib_objet,
    delib_matiere_code,
    delib_matiere_nom,
    pref_id,
    pref_date,
    vote_effectif,
    vote_reel,
    vote_pour,
    vote_contre,
    vote_abstention,
    raw_data
) VALUES (
    @delib_id,
    @collectivite,
    @instance,
    @coll_nom,
    @coll_siret,
    @delib_date,
    @delib_objet,
    @delib_matiere_code,
    @delib_matiere_nom,
    @pref_id,
    @pref_date,
    @vote_effectif,
    @vote_reel,
    @vote_pour,
    @vote_contre,
    @vote_abstention,
    @raw_data
)
ON CONFLICT (delib_id, collectivite, instance) DO UPDATE SET
    instance           = EXCLUDED.instance,
    coll_nom           = EXCLUDED.coll_nom,
    coll_siret         = EXCLUDED.coll_siret,
    delib_date         = EXCLUDED.delib_date,
    delib_objet        = EXCLUDED.delib_objet,
    delib_matiere_code = EXCLUDED.delib_matiere_code,
    delib_matiere_nom  = EXCLUDED.delib_matiere_nom,
    pref_id            = EXCLUDED.pref_id,
    pref_date          = EXCLUDED.pref_date,
    vote_effectif      = EXCLUDED.vote_effectif,
    vote_reel          = EXCLUDED.vote_reel,
    vote_pour          = EXCLUDED.vote_pour,
    vote_contre        = EXCLUDED.vote_contre,
    vote_abstention    = EXCLUDED.vote_abstention,
    raw_data           = EXCLUDED.raw_data;

-- name: ListDeliberations :many
SELECT 
    id, delib_id, 
    collectivite, instance, 
    coll_nom, coll_siret, 
    delib_date, delib_objet, delib_matiere_code, delib_matiere_nom, 
    pref_id, pref_date, 
    vote_effectif, vote_reel, vote_pour, vote_contre, vote_abstention, 
    created_at, updated_at 
FROM app.deliberations
WHERE
    -- Filtres optionnels : array vide ou NULL = pas de filtre
    (sqlc.narg('collectivites')::text[] IS NULL 
        OR collectivite = ANY(sqlc.narg('collectivites')::text[]))
    AND (sqlc.narg('instances')::text[] IS NULL 
        OR instance = ANY(sqlc.narg('instances')::text[]))
    AND (sqlc.narg('matieres')::text[] IS NULL 
        OR delib_matiere_code = ANY(sqlc.narg('matieres')::text[]))
    AND (sqlc.narg('date_from')::date IS NULL 
        OR delib_date >= sqlc.narg('date_from')::date)
    AND (sqlc.narg('date_to')::date IS NULL 
        OR delib_date <= sqlc.narg('date_to')::date)
    AND (sqlc.narg('search')::text IS NULL 
        OR to_tsvector('french_unaccent', delib_objet) 
           @@ websearch_to_tsquery('french_unaccent', sqlc.narg('search')::text))
ORDER BY
    CASE WHEN sqlc.arg('sort_asc')::bool THEN delib_date END ASC,
    CASE WHEN NOT sqlc.arg('sort_asc')::bool THEN delib_date END DESC,
    id  -- tie-breaker pour stabilité
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: FindDeliberationByID :one
SELECT
    id, delib_id, documents,
    collectivite, instance,
    coll_nom, coll_siret,
    delib_date, delib_objet, delib_matiere_code, delib_matiere_nom,
    pref_id, pref_date,
    vote_effectif, vote_reel, vote_pour, vote_contre, vote_abstention,
    created_at, updated_at
FROM app.deliberations
WHERE id = $1;

-- name: ListDeliberationsByIDs :many
SELECT
    id, delib_id,
    collectivite, instance,
    coll_nom, coll_siret,
    delib_date, delib_objet, delib_matiere_code, delib_matiere_nom,
    pref_id, pref_date,
    vote_effectif, vote_reel, vote_pour, vote_contre, vote_abstention,
    created_at, updated_at
FROM app.deliberations
WHERE id = ANY(@ids::uuid[]);

-- name: ListDeliberationsWithoutDocuments :many
SELECT id, delib_id, instance
FROM app.deliberations
WHERE documents IS NULL
ORDER BY delib_date DESC
LIMIT $1;

-- name: SetDeliberationDocuments :exec
UPDATE app.deliberations
SET documents = $1
WHERE id = $2
  AND documents IS NULL;