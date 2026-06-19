-- +goose Up
CREATE TABLE app.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email           TEXT NOT NULL,
    password        TEXT NOT NULL,
    roles           TEXT[] NOT NULL DEFAULT '{}',
    CONSTRAINT ck_users_roles CHECK (roles <@ ARRAY['contributeur','admin']::TEXT[]),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_users_email
    ON app.users (lower(email))
    WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS app.users;