package config

import (
	"fmt"
	"os"
)

func getEnv(key, def string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return def
}

type Config interface {
	ActiveProfile() string
	IsProd() bool
	Postgres() Postgres
	Server() Server
	Mailer() Mailer
	Tokens() Tokens
}

func Load() (Config, error) {
	cfg := &config{
		activeProfile: getEnv("ACTIVE_PROFILE", "test"),
		server:        loadServer(),
	}
	isProd := cfg.IsProd()

	var err error

	if cfg.postgres, err = loadPostgres(); err != nil {
		return nil, fmt.Errorf("failed to load postgres config: %w", err)
	}
	if cfg.mailer, err = loadMailer(isProd); err != nil {
		return nil, fmt.Errorf("failed to load mailer config: %w", err)
	}
	if cfg.tokens, err = loadTokens(isProd); err != nil {
		return nil, fmt.Errorf("failed to load tokens config: %w", err)
	}

	return cfg, nil
}

type config struct {
	activeProfile string
	postgres      Postgres
	server        Server
	mailer        Mailer
	tokens        Tokens
}

func (c *config) ActiveProfile() string { return c.activeProfile }
func (c *config) IsProd() bool          { return c.activeProfile == "prod" }
func (c *config) Postgres() Postgres    { return c.postgres }
func (c *config) Server() Server        { return c.server }
func (c *config) Mailer() Mailer        { return c.mailer }
func (c *config) Tokens() Tokens        { return c.tokens }
