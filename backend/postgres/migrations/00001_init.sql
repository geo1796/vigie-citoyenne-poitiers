-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);

ALTER TEXT SEARCH CONFIGURATION french_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, french_stem;

CREATE SCHEMA IF NOT EXISTS app;

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose Down
DROP FUNCTION IF EXISTS set_updated_at();
DROP SCHEMA IF EXISTS app CASCADE;
DROP TEXT SEARCH CONFIGURATION IF EXISTS french_unaccent;
DROP EXTENSION IF EXISTS unaccent;
DROP EXTENSION IF EXISTS pgcrypto;