package config

import (
	"errors"
	"fmt"
	"strconv"
)

type Mailer struct {
	Host     string
	Port     int
	Address  string
	Password string
}

func loadMailer(isProd bool) (Mailer, error) {
	cfg := Mailer{
		Host:     getEnv("MAILER_HOST", ""),
		Address:  getEnv("MAILER_ADDRESS", ""),
		Password: getEnv("MAILER_PASSWORD", ""),
	}

	if isProd {
		if cfg.Host == "" {
			return Mailer{}, errors.New("MAILER_HOST must be set in production")
		}
		if cfg.Address == "" {
			return Mailer{}, errors.New("MAILER_ADDRESS must be set in production")
		}
		if cfg.Password == "" {
			return Mailer{}, errors.New("MAILER_PASSWORD must be set in production")
		}
	}

	var err error
	if cfg.Port, err = strconv.Atoi(getEnv("MAILER_PORT", "587")); err != nil {
		return Mailer{}, fmt.Errorf("failed to parse MAILER_PORT: %w", err)
	}

	return cfg, nil
}
