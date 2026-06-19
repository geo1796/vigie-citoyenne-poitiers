-- name: CreateRefreshToken :exec
INSERT INTO app.refresh_tokens(user_id, hash, expires_at) 
VALUES ($1, $2, $3);

-- name: FindRefreshTokenByHashForUpdate :one
SELECT * FROM app.refresh_tokens
WHERE hash = $1
FOR UPDATE;

-- name: DeleteRefreshTokensByUserID :exec
UPDATE app.refresh_tokens
SET deleted_at = NOW()
WHERE user_id = $1 AND deleted_at IS NULL;

-- name: DeleteRefreshTokenByHash :exec
UPDATE app.refresh_tokens
SET deleted_at = NOW()
WHERE hash = $1 AND deleted_at IS NULL;