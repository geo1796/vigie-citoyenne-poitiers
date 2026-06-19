package main

import (
	"context"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/config"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/ingester"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

func runIngest(ctx context.Context, args []string, cfg config.Config) int {
	if len(args) < 1 {
		logger.Error("usage: vigie ingest <deliberations|indicateurs>")
		return 2
	}

	db, err := postgres.NewDB(ctx, cfg.Postgres().DSN,
		cfg.Postgres().ConnMaxLifetime, cfg.Postgres().ConnMaxIdleTime,
		cfg.Postgres().MaxOpenConns, cfg.Postgres().MaxIdleConns)
	if err != nil {
		logger.Error("failed to create database", logger.Err(err))
		return 1
	}
	defer db.Close()

	httpClient := ingester.NewHTTPClient(time.Second * 60)
	defer httpClient.CloseIdleConnections()

	svc, err := ingester.NewService(httpClient, dao.New(db.Pool()))
	if err != nil {
		logger.Error("failed to create ingester.Service", logger.Err(err))
		return 1
	}

	err = svc.Ingest(ctx, args)

	if err != nil {
		logger.Error("failed to ingest data",
			logger.Any("args", args),
			logger.Err(err))
		return 1
	}

	logger.Info("ingest complete", logger.Any("args", args))
	return 0
}
