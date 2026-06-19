package async

import (
	"context"
	"time"
)

type GoroutineRunner struct {
	rootCtx        context.Context
	defaultTimeout time.Duration
}

func (r *GoroutineRunner) Run(fn func(ctx context.Context)) {
	r.RunWithTimeout(r.defaultTimeout, fn)
}

func (r *GoroutineRunner) RunWithTimeout(timeout time.Duration, fn func(ctx context.Context)) {
	if timeout <= 0 {
		timeout = r.defaultTimeout
	}
	go func() {
		execute(timeout, r.rootCtx, fn)
	}()
}

func NewGoroutineRunner(rootCtx context.Context, defaultTimeout time.Duration) Runner {
	if defaultTimeout <= 0 {
		defaultTimeout = 2 * time.Second
	}
	return &GoroutineRunner{
		rootCtx:        rootCtx,
		defaultTimeout: defaultTimeout,
	}
}
