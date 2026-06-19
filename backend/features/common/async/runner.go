package async

import (
	"context"
	"errors"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

type Runner interface {
	Run(fn func(ctx context.Context))
	RunWithTimeout(timeout time.Duration, fn func(ctx context.Context))
}

func execute(timeout time.Duration, rootCtx context.Context, fn func(ctx context.Context)) {
	ctx, cancel := context.WithTimeout(rootCtx, timeout)
	defer cancel()
	defer func() {
		if err := recover(); err != nil {
			logger.Error("runner recovered panic", logger.Any("panic", err))
		}
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			logger.Info("runner job timed out")
		}
	}()
	fn(ctx)
}
