-- +goose Up
CREATE TABLE app.refresh_tokens
(
    id         UUID        NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),

    user_id    UUID        NOT NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES app.users (id) ON DELETE CASCADE,

    hash           CHAR(43)    NOT NULL,
    expires_at     TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- +goose Down
DROP TABLE IF EXISTS app.refresh_tokens;