-- name: CreateEngagement :one
INSERT INTO app.engagements (
    title,
    content,
    created_by
) VALUES (
    @title,
    @content,
    @created_by
)
RETURNING id, title, content, created_by, created_at, updated_at;

-- name: LinkEngagementDeliberations :batchexec
INSERT INTO app.engagement_deliberations (
    engagement_id,
    deliberation_id
) VALUES (
    @engagement_id,
    @deliberation_id
)
ON CONFLICT DO NOTHING;

-- name: LinkEngagementObservations :batchexec
INSERT INTO app.engagement_indicateur_observations (
    engagement_id,
    observation_id
) VALUES (
    @engagement_id,
    @observation_id
)
ON CONFLICT DO NOTHING;

-- name: ListEngagements :many
SELECT
    e.id, e.title, e.content,
    e.created_by, u.email AS author_email,
    e.created_at, e.updated_at
FROM app.engagements e
JOIN app.users u ON u.id = e.created_by
ORDER BY e.created_at DESC, e.id
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: FindEngagementByID :one
SELECT
    e.id, e.title, e.content,
    e.created_by, u.email AS author_email,
    e.created_at, e.updated_at
FROM app.engagements e
JOIN app.users u ON u.id = e.created_by
WHERE e.id = $1;

-- name: ListEngagementDeliberations :many
SELECT
    d.id, d.delib_id,
    d.collectivite, d.instance,
    d.coll_nom, d.coll_siret,
    d.delib_date, d.delib_objet, d.delib_matiere_code, d.delib_matiere_nom,
    d.pref_id, d.pref_date,
    d.vote_effectif, d.vote_reel, d.vote_pour, d.vote_contre, d.vote_abstention,
    d.created_at, d.updated_at
FROM app.engagement_deliberations ed
JOIN app.deliberations d ON d.id = ed.deliberation_id
WHERE ed.engagement_id = $1
ORDER BY d.delib_date DESC, d.id;

-- name: ListEngagementObservations :many
SELECT o.id, o.key, o.reference, o.data, o.created_at, o.updated_at
FROM app.engagement_indicateur_observations eio
JOIN app.indicateur_observations o ON o.id = eio.observation_id
WHERE eio.engagement_id = $1
ORDER BY o.key, o.reference ASC;
