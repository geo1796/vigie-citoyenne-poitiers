package config

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

type Postgres struct {
	DSN             string
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	MaxOpenConns    int32
	MaxIdleConns    int32
}

func loadPostgres() (Postgres, error) {
	connMaxLifetime, err := time.ParseDuration(getEnv("PG_CONN_MAX_LIFETIME", "10m"))
	if err != nil {
		return Postgres{}, fmt.Errorf("failed to parse PG_CONN_MAX_LIFETIME: %v", err)
	}

	connMaxIdleTime, err := time.ParseDuration(getEnv("PG_CONN_MAX_IDLE_TIME", "5m"))
	if err != nil {
		return Postgres{}, fmt.Errorf("failed to parse PG_CONN_MAX_IDLE_TIME: %v", err)
	}

	maxOpenConns, err := strconv.Atoi(getEnv("PG_MAX_OPEN_CONNS", "2"))
	if err != nil {
		return Postgres{}, fmt.Errorf("failed to parse PG_MAX_OPEN_CONNS: %v", err)
	}

	maxIdleConns, err := strconv.Atoi(getEnv("PG_MAX_IDLE_CONNS", "1"))
	if err != nil {
		return Postgres{}, fmt.Errorf("failed to parse PG_MAX_IDLE_CONNS: %v", err)
	}

	dsn := strings.Join([]string{
		"host=" + getEnv("PG_HOST", ""),
		"port=" + getEnv("PG_PORT", ""),
		"user=" + getEnv("PG_USER", ""),
		"password=" + getEnv("PG_PASSWORD", ""),
		"dbname=" + getEnv("PG_DBNAME", ""),
		"sslmode=" + getEnv("PG_SSLMODE", "require"),
	}, " ")

	return Postgres{
		DSN:             dsn,
		ConnMaxLifetime: connMaxLifetime,
		ConnMaxIdleTime: connMaxIdleTime,
		MaxOpenConns:    int32(maxOpenConns),
		MaxIdleConns:    int32(maxIdleConns),
	}, nil
}
