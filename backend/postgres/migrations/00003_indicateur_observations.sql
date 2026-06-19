-- +goose Up
CREATE TABLE app.indicateur_observations (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT pk_indicateur_observations PRIMARY KEY (id),

    key         TEXT        NOT NULL,
    reference   TEXT        NOT NULL,
    data        JSONB       NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (key, reference)
);

-- Trigger pour maintenir updated_at automatiquement
CREATE TRIGGER trg_indicateur_observations_updated_at
    BEFORE UPDATE ON app.indicateur_observations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indicateur_observations_key
    ON app.indicateur_observations (key);

-- +goose Down
DROP TABLE app.indicateur_observations;