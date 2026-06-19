-- +goose Up
CREATE TABLE app.engagements (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT  pk_engagements PRIMARY KEY (id),

    title       TEXT NOT NULL,
    content     TEXT NOT NULL,

    created_by  UUID NOT NULL,
    CONSTRAINT  fk_engagements_user FOREIGN KEY (created_by)
        REFERENCES app.users (id) ON DELETE CASCADE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_engagements_updated_at
    BEFORE UPDATE ON app.engagements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_engagements_created_at ON app.engagements (created_at DESC);

CREATE TABLE app.engagement_deliberations (
    engagement_id   UUID NOT NULL,
    CONSTRAINT fk_engagement_deliberations_engagement FOREIGN KEY (engagement_id)
        REFERENCES app.engagements (id) ON DELETE CASCADE,

    deliberation_id UUID NOT NULL,
    CONSTRAINT fk_engagement_deliberations_deliberation FOREIGN KEY (deliberation_id)
        REFERENCES app.deliberations (id) ON DELETE CASCADE,

    CONSTRAINT pk_engagement_deliberations PRIMARY KEY (engagement_id, deliberation_id)
);

CREATE INDEX idx_engagement_deliberations_deliberation_id
    ON app.engagement_deliberations (deliberation_id);

CREATE TABLE app.engagement_indicateur_observations (
    engagement_id  UUID NOT NULL,
    CONSTRAINT fk_engagement_observations_engagement FOREIGN KEY (engagement_id)
        REFERENCES app.engagements (id) ON DELETE CASCADE,

    observation_id UUID NOT NULL,
    CONSTRAINT fk_engagement_observations_observation FOREIGN KEY (observation_id)
        REFERENCES app.indicateur_observations (id) ON DELETE CASCADE,

    CONSTRAINT pk_engagement_observations PRIMARY KEY (engagement_id, observation_id)
);

CREATE INDEX idx_engagement_observations_observation_id
    ON app.engagement_indicateur_observations (observation_id);

-- +goose Down
DROP TABLE IF EXISTS app.engagement_indicateur_observations;
DROP TABLE IF EXISTS app.engagement_deliberations;
DROP TABLE IF EXISTS app.engagements;
