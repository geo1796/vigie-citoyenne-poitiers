-- +goose Up
CREATE TABLE app.engagements (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT  pk_engagements PRIMARY KEY (id),

    title       TEXT NOT NULL,

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

-- Chaque engagement est suivi dans le temps via une timeline de mises à jour.
-- Une mise à jour justifie un statut et référence, au choix, une délibération
-- (deliberation_id) et/ou une source externe (external_source, ex. article de presse).
CREATE TABLE app.engagement_updates (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT      pk_engagement_updates PRIMARY KEY (id),

    engagement_id   UUID NOT NULL,
    CONSTRAINT fk_engagement_updates_engagement FOREIGN KEY (engagement_id)
        REFERENCES app.engagements (id) ON DELETE CASCADE,

    status          TEXT NOT NULL,
    CONSTRAINT ck_engagement_updates_status
        CHECK (status IN ('en_attente', 'en_cours', 'en_tension', 'tenu', 'rompu')),

    content         TEXT NOT NULL,

    -- Date de l'événement documenté par la mise à jour (saisie par le contributeur),
    -- distincte de created_at qui n'est que l'horodatage d'insertion en base.
    event_date      DATE NOT NULL,

    deliberation_id UUID,
    CONSTRAINT fk_engagement_updates_deliberation FOREIGN KEY (deliberation_id)
        REFERENCES app.deliberations (id) ON DELETE SET NULL,

    external_source TEXT,

    created_by      UUID NOT NULL,
    CONSTRAINT fk_engagement_updates_user FOREIGN KEY (created_by)
        REFERENCES app.users (id) ON DELETE CASCADE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_engagement_updates_updated_at
    BEFORE UPDATE ON app.engagement_updates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Sert au listing d'une timeline et à la dérivation du statut courant d'un engagement
-- (mise à jour la plus récente).
CREATE INDEX idx_engagement_updates_engagement_id
    ON app.engagement_updates (engagement_id, created_at DESC);

CREATE INDEX idx_engagement_updates_deliberation_id
    ON app.engagement_updates (deliberation_id)
    WHERE deliberation_id IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS app.engagement_updates;
DROP TABLE IF EXISTS app.engagements;
