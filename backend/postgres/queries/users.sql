-- name: FindUserByEmail :one
SELECT * FROM app.users
WHERE email = $1;

-- name: FindUserByID :one
SELECT * FROM app.users
WHERE id = $1;

-- name: UpdateUserPassword :one
UPDATE app.users
SET password = $2
WHERE id = $1
RETURNING id;

-- name: UserExistsByEmail :one
SELECT EXISTS(
    SELECT 1 FROM app.users
    WHERE email = $1
) AS exists;

-- name: CreateUser :exec
INSERT INTO app.users(email, password, roles)
VALUES ($1, $2, $3);