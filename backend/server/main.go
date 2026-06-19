package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/config"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/async"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/mailer"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/validatorx"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/geo1796/vigie-citoyenne-poitiers/server/api"
	"github.com/geo1796/vigie-citoyenne-poitiers/server/spa"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	os.Exit(run())
}

func run() int {
	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", logger.Err(err))
		return 1
	}

	if cfg.IsProd() {
		logger.SetGlobalLogger(logger.New(logger.LevelInfo))
	}

	// Sub-command routing before anything else.
	if len(os.Args) > 1 {

		if os.Args[1] == "migrate" {
			return runMigrate(rootCtx, os.Args[2:], cfg)
		}

		if os.Args[1] == "ingest" {
			return runIngest(rootCtx, os.Args[2:], cfg)
		}

	}

	db, err := postgres.NewDB(rootCtx, cfg.Postgres().DSN,
		cfg.Postgres().ConnMaxLifetime, cfg.Postgres().ConnMaxIdleTime,
		cfg.Postgres().MaxOpenConns, cfg.Postgres().MaxIdleConns)
	if err != nil {
		logger.Error("failed to create database", logger.Err(err))
		return 1
	}
	defer db.Close()

	if err = db.PingWithRetry(rootCtx, 8, 100*time.Millisecond); err != nil {
		logger.Error("failed to connect to database", logger.Err(err))
		return 1
	}

	store := postgres.NewStore(db.Pool())
	runner := async.NewGoroutineRunner(rootCtx, time.Second*2)
	mailer := mailer.New(
		cfg.Mailer().Port,
		cfg.Mailer().Host,
		cfg.Mailer().Address,
		cfg.Mailer().Password,
	)

	accessTokenManager := auth.NewAccessTokenManager(auth.NewJWTManager[auth.AccessTokenClaims](
		cfg.Tokens().AccessTokenSecret,
		cfg.Tokens().AccessTokenTTL,
	))

	registrationTokenManager := auth.NewRegistrationTokenManager(auth.NewJWTManager[auth.RegistrationClaims](
		cfg.Tokens().RegistrationTokenSecret,
		cfg.Tokens().RegistrationTokenTTL,
	))

	refreshTokenIssuer := auth.NewRefreshTokenIssuer(auth.NewOpaqueTokenIssuer(
		cfg.Tokens().RefreshTokenSecret,
		cfg.Tokens().RefreshTokenTTL,
	))

	passwordResetTokenIssuer := auth.NewPasswordResetTokenIssuer(auth.NewOpaqueTokenIssuer(
		cfg.Tokens().PasswordResetTokenSecret,
		cfg.Tokens().PasswordResetTokenTTL,
	))

	appLinks, err := auth.NewAppLinks()
	if err != nil {
		logger.Error("failed to create appLinks", logger.Err(err))
		return 1
	}

	if err = validatorx.Init(); err != nil {
		logger.Error("failed to init validatorx", logger.Err(err))
		return 1
	}

	r := chi.NewRouter()

	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)
	r.Use(middleware.Timeout(20 * time.Second))

	r.Get("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")

		ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
		defer cancel()

		if err := db.Pool().Ping(ctx); err != nil {
			logger.Warn("readyz: db ping failed", logger.Err(err))
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte("db ping failed"))
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("db ok"))
	})

	r.Mount("/api/v1", api.Router(
		store,
		runner,
		mailer,
		accessTokenManager,
		registrationTokenManager,
		refreshTokenIssuer,
		passwordResetTokenIssuer,
		appLinks,
	))
	spa.MountSPA(r)

	srv := &http.Server{
		Addr:    cfg.Server().Addr,
		Handler: r,
	}

	var wg sync.WaitGroup

	wg.Go(func() {
		<-rootCtx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Error("error shutting down server", logger.Err(err))
		}
	})

	logger.Info("server started")
	exitCode := 0
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", logger.Err(err))
		exitCode = 1
		stop()
	}

	wg.Wait()
	return exitCode
}
