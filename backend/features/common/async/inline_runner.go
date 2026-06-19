package async

import (
	"context"
	"time"
)

type InlineRunner struct {
	rootCtx        context.Context
	defaultTimeout time.Duration
}

func (r *InlineRunner) Run(fn func(ctx context.Context)) {
	r.RunWithTimeout(r.defaultTimeout, fn)
}

func (r *InlineRunner) RunWithTimeout(timeout time.Duration, fn func(ctx context.Context)) {
	if timeout <= 0 {
		timeout = r.defaultTimeout
	}
	execute(timeout, r.rootCtx, fn)
}

func NewInlineRunner(rootCtx context.Context, defaultTimeout time.Duration) Runner {
	if defaultTimeout <= 0 {
		defaultTimeout = 2 * time.Second
	}
	return &InlineRunner{
		rootCtx:        rootCtx,
		defaultTimeout: defaultTimeout,
	}
}
