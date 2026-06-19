-- name: CreatePasswordResetToken :exec
INSERT INTO app.password_reset_tokens (user_id, hash, expires_at)
VALUES ($1, $2, $3);

-- name: FindPasswordResetTokenByHashForUpdate :one
SELECT * FROM app.password_reset_tokens
WHERE hash = $1
FOR UPDATE;

-- name: DeletePasswordResetTokensByUserID :exec
DELETE FROM app.password_reset_tokens
WHERE user_id = $1;