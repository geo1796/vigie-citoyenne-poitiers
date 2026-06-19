package config

import (
	"errors"
	"fmt"
	"time"
)

type Tokens struct {
	RegistrationTokenSecret []byte
	RegistrationTokenTTL    time.Duration

	PasswordResetTokenSecret []byte
	PasswordResetTokenTTL    time.Duration

	AccessTokenSecret []byte
	AccessTokenTTL    time.Duration

	RefreshTokenSecret []byte
	RefreshTokenTTL    time.Duration
}

func loadTokens(isProd bool) (Tokens, error) {
	cfg := Tokens{
		RegistrationTokenSecret:  []byte(getEnv("REGISTRATION_TOKEN_SECRET", "")),
		PasswordResetTokenSecret: []byte(getEnv("PASSWORD_RESET_TOKEN_SECRET", "")),
		AccessTokenSecret:        []byte(getEnv("ACCESS_TOKEN_SECRET", "")),
		RefreshTokenSecret:       []byte(getEnv("REFRESH_TOKEN_SECRET", "")),
	}

	if isProd && len(cfg.RegistrationTokenSecret) == 0 {
		return cfg, errors.New("REGISTRATION_TOKEN_SECRET must be set in production")
	}
	if isProd && len(cfg.PasswordResetTokenSecret) == 0 {
		return cfg, errors.New("PASSWORD_RESET_TOKEN_SECRET must be set in production")
	}
	if isProd && len(cfg.AccessTokenSecret) == 0 {
		return cfg, errors.New("ACCESS_TOKEN_SECRET must be set in production")
	}
	if isProd && len(cfg.RefreshTokenSecret) == 0 {
		return cfg, errors.New("REFRESH_TOKEN_SECRET must be set in production")
	}

	var err error

	if cfg.AccessTokenTTL, err = time.ParseDuration(getEnv("ACCESS_TOKEN_TTL", "45s")); err != nil {
		return Tokens{}, fmt.Errorf("failed to parse ACCESS_TOKEN_TTL: %v", err)
	}
	if cfg.RefreshTokenTTL, err = time.ParseDuration(getEnv("REFRESH_TOKEN_TTL", "60s")); err != nil {
		return Tokens{}, fmt.Errorf("failed to parse REFRESH_TOKEN_TTL: %v", err)
	}
	if cfg.RegistrationTokenTTL, err = time.ParseDuration(getEnv("REGISTRATION_TOKEN_TTL", "45s")); err != nil {
		return Tokens{}, fmt.Errorf("failed to parse REGISTRATION_TOKEN_TTL: %v", err)
	}
	if cfg.PasswordResetTokenTTL, err = time.ParseDuration(getEnv("PASSWORD_RESET_TOKEN_TTL", "45s")); err != nil {
		return Tokens{}, fmt.Errorf("failed to parse PASSWORD_RESET_TOKEN_TTL: %v", err)
	}

	return cfg, nil
}
