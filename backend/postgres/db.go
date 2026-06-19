package postgres

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

type DB interface {
	PingWithRetry(ctx context.Context, retries int, delay time.Duration) error
	Pool() *pgxpool.Pool
	Migrate() error
	Close()
}

type db struct {
	pool *pgxpool.Pool
}

func (db *db) Pool() *pgxpool.Pool {
	return db.pool
}

func (db *db) Migrate() error {
	sqlDB := stdlib.OpenDBFromPool(db.pool)
	defer func() { _ = sqlDB.Close() }()

	goose.SetBaseFS(migrationsFS)

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}
	return nil
}

func (db *db) Close() {
	db.pool.Close()
}

func NewDB(ctx context.Context, dsn string,
	connMaxLifetime, connMaxIdleTime time.Duration,
	maxOpenConns, maxIdleConns int32) (DB, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse pgx pool config: %v", err)
	}

	cfg.MaxConnLifetime = connMaxLifetime
	cfg.MaxConnIdleTime = connMaxIdleTime
	cfg.MaxConns = maxOpenConns
	cfg.MinConns = maxIdleConns

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create pgx pool: %v", err)
	}

	return &db{pool}, nil
}

func (db *db) PingWithRetry(ctx context.Context, retries int, delay time.Duration) error {
	if retries < 1 {
		return errors.New("pingWithRetry: retries must be >= 1")
	}
	pool := db.Pool()
	var err error
	for i := range retries {
		pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		err = pool.Ping(pingCtx)
		cancel()
		if err == nil {
			return nil
		}
		if i == retries-1 {
			break
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
		if delay < time.Second {
			delay *= 2 // backoff plafonné implicitement
		}
	}
	return err
}
