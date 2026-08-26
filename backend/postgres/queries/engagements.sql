-- name: CreateEngagement :one
INSERT INTO app.engagements (
    title,
    created_by
) VALUES (
    @title,
    @created_by
)
RETURNING id, title, created_by, created_at, updated_at;

-- name: ListEngagements :many
SELECT
    e.id, e.title,
    e.created_by, u.email AS author_email,
    e.created_at, e.updated_at,
    COALESCE(latest.status, 'en_attente') AS status,
    (SELECT MAX(eu.event_date)
        FROM app.engagement_updates eu
        WHERE eu.engagement_id = e.id) AS latest_event_date
FROM app.engagements e
JOIN app.users u ON u.id = e.created_by
LEFT JOIN LATERAL (
    SELECT eu.status
    FROM app.engagement_updates eu
    WHERE eu.engagement_id = e.id
    ORDER BY eu.created_at DESC, eu.id DESC
    LIMIT 1
) latest ON TRUE
ORDER BY e.created_at DESC, e.id
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: FindEngagementByID :one
SELECT
    e.id, e.title,
    e.created_by, u.email AS author_email,
    e.created_at, e.updated_at,
    COALESCE(latest.status, 'en_attente') AS status,
    (SELECT MAX(eu.event_date)
        FROM app.engagement_updates eu
        WHERE eu.engagement_id = e.id) AS latest_event_date
FROM app.engagements e
JOIN app.users u ON u.id = e.created_by
LEFT JOIN LATERAL (
    SELECT eu.status
    FROM app.engagement_updates eu
    WHERE eu.engagement_id = e.id
    ORDER BY eu.created_at DESC, eu.id DESC
    LIMIT 1
) latest ON TRUE
WHERE e.id = $1;

-- name: CreateEngagementUpdate :one
INSERT INTO app.engagement_updates (
    engagement_id,
    status,
    content,
    event_date,
    deliberation_id,
    external_source,
    created_by
) VALUES (
    @engagement_id,
    @status,
    @content,
    @event_date,
    @deliberation_id,
    @external_source,
    @created_by
)
RETURNING id, engagement_id, status, content, event_date, deliberation_id, external_source,
    created_by, created_at, updated_at;

-- name: ListEngagementUpdates :many
SELECT
    eu.id, eu.status, eu.content, eu.event_date, eu.external_source, eu.deliberation_id,
    eu.created_by, u.email AS author_email, eu.created_at
FROM app.engagement_updates eu
JOIN app.users u ON u.id = eu.created_by
WHERE eu.engagement_id = $1
ORDER BY eu.created_at DESC, eu.id DESC;
