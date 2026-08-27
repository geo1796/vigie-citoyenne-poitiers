CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);

ALTER TEXT SEARCH CONFIGURATION french_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, french_stem;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE app.deliberations (
    -- Identité technique
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT      pk_deliberations PRIMARY KEY (id),
    
    -- Identité métier (DELIB_ID dans le SCDL)
    delib_id        TEXT NOT NULL,
    
    -- Provenance institutionnelle (injecté par le mapper depuis la config du dataset)
    collectivite    TEXT NOT NULL,
    CONSTRAINT ck_deliberations_collectivite CHECK (collectivite IN ('poitiers', 'grand_poitiers')),

    instance        TEXT NOT NULL,
    CONSTRAINT ck_deliberations_instance CHECK (instance IN ('conseil_municipal', 'conseil_communautaire', 'bureau_communautaire')),
    
    -- Identité émettrice
    coll_nom        TEXT NOT NULL,
    coll_siret      TEXT NOT NULL,
    
    -- Métadonnées de l'acte
    delib_date         DATE NOT NULL,
    delib_objet        TEXT NOT NULL,
    delib_matiere_code TEXT NOT NULL,
    delib_matiere_nom  TEXT NOT NULL,
    
    -- Préfecture (contrôle de légalité) — NULL si absent (la sentinelle "0" est normalisée par le mapper)
    pref_id         TEXT,
    pref_date       DATE,
    
    -- Votes (rejetés à l'ingestion si malformés, donc NOT NULL en base)
    vote_effectif   INTEGER NOT NULL,
    vote_reel       INTEGER NOT NULL,
    vote_pour       INTEGER NOT NULL,
    vote_contre     INTEGER NOT NULL,
    vote_abstention INTEGER NOT NULL,
    
    -- Snapshot complet du payload SCDL pour audit
    raw_data        JSONB NOT NULL,

    -- Noms et liens des documents webdelib
    documents       JSONB,
    
    -- Tracking standard
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (delib_id, collectivite, instance)
);

-- Trigger pour maintenir updated_at automatiquement
CREATE TRIGGER trg_deliberations_updated_at
    BEFORE UPDATE ON app.deliberations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Index pour les patterns de requête principaux
CREATE INDEX idx_deliberations_delib_date ON app.deliberations (delib_date DESC);

-- Recherche full-text français sur l'objet
CREATE INDEX idx_deliberations_objet_fts ON app.deliberations 
    USING gin (to_tsvector('french_unaccent', delib_objet));


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



CREATE TABLE app.engagements (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT  pk_engagements PRIMARY KEY (id),

    title       TEXT NOT NULL,

    -- Provenance de l'engagement en texte libre (programme, discours, article de presse…).
    reference   TEXT NOT NULL,

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