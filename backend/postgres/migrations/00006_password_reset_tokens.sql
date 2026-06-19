-- +goose Up
CREATE TABLE app.password_reset_tokens
(
    id         UUID        NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),

    user_id    UUID        NOT NULL,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id)
        REFERENCES app.users (id) ON DELETE CASCADE,

    hash           CHAR(43)    NOT NULL,
    expires_at     TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS app.password_reset_tokens;