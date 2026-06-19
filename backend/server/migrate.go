package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	"github.com/geo1796/vigie-citoyenne-poitiers/config"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/migrations"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
	"github.com/pressly/goose/v3"
)

// runMigrate dispatches goose commands. Returns an exit code.
func runMigrate(ctx context.Context, args []string, cfg config.Config) int {
	if len(args) == 0 {
		logger.Error("usage: vigie migrate <up|down|status|version|redo|reset>")
		return 2
	}

	// Open a dedicated *sql.DB via pgx stdlib driver — goose needs database/sql.
	db, err := sql.Open("pgx", cfg.Postgres().DSN)
	if err != nil {
		logger.Error("open db", logger.Err(err))
		return 1
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		logger.Error("ping db", logger.Err(err))
		return 1
	}

	goose.SetBaseFS(migrations.FS)
	goose.SetLogger(gooseSlogAdapter{})

	if err := goose.SetDialect("postgres"); err != nil {
		logger.Error("set dialect", logger.Err(err))
		return 1
	}

	cmd := args[0]
	cmdArgs := args[1:]

	if err := goose.RunContext(ctx, cmd, db, ".", cmdArgs...); err != nil {
		logger.Error("goose command failed", logger.Any("cmd", cmd), logger.Err(err))
		return 1
	}

	return 0
}

// gooseSlogAdapter pipes goose's logger into slog so output is consistent
// with the rest of the binary.
type gooseSlogAdapter struct{}

func (gooseSlogAdapter) Fatalf(format string, v ...interface{}) {
	logger.Error(fmt.Sprintf(format, v...))
	os.Exit(1)
}

func (gooseSlogAdapter) Printf(format string, v ...interface{}) {
	logger.Info(fmt.Sprintf(format, v...))
}
