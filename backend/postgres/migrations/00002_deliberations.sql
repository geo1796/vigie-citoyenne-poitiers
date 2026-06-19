-- +goose Up
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

-- +goose Down
DROP TABLE IF EXISTS app.deliberations;