package postgres

import (
	"context"
	"fmt"

	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	ExecTx(ctx context.Context, fn func(*dao.Queries) error) error
	Queries() *dao.Queries
}

type store struct {
	pool    *pgxpool.Pool
	queries *dao.Queries
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{
		pool:    pool,
		queries: dao.New(pool),
	}
}

func (s *store) Queries() *dao.Queries {
	return s.queries
}

func (s *store) ExecTx(ctx context.Context, fn func(*dao.Queries) error) error {
	return s.withTx(ctx, func(tx pgx.Tx) error {
		return fn(s.queries.WithTx(tx))
	})
}

func (s *store) withTx(ctx context.Context, fn func(pgx.Tx) error) (err error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			rbErr := tx.Rollback(ctx)
			logger.Error("transaction panicked, rolling back",
				logger.Any("rollback error", rbErr),
				logger.Any("panic", p))
			panic(p)
		} else if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil {
				logger.Error("failed to rollback transaction",
					logger.Any("rollback error", rbErr),
					logger.Any("original error", err))
			}
		} else {
			if cmErr := tx.Commit(ctx); cmErr != nil {
				err = fmt.Errorf("failed to commit transaction: %w", cmErr)
			}
		}
	}()

	return fn(tx)
}
