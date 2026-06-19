package async

import (
	"context"
	"testing"
	"time"
)

// helper: wait for a channel to close or timeout
func waitClosed(t *testing.T, ch <-chan struct{}, d time.Duration) {
	t.Helper()
	select {
	case <-ch:
		return
	case <-time.After(d):
		t.Fatalf("timed out waiting for channel close after %v", d)
	}
}

func TestGoroutineRunner_Run_UsesDefaultTimeoutAndIsAsync(t *testing.T) {
	root := context.Background()
	defaultTimeout := 120 * time.Millisecond
	r := NewGoroutineRunner(root, defaultTimeout)

	start := time.Now()
	done := make(chan struct{})

	r.Run(func(ctx context.Context) {
		// Job completes when the context times out
		<-ctx.Done()
		close(done)
	})

	// Since it's async, the call should return quickly (well below the job timeout)
	if elapsed := time.Since(start); elapsed > 50*time.Millisecond {
		t.Fatalf("Run should return quickly for async runner; took %v", elapsed)
	}

	// The job should finish around the default timeout
	waitClosed(t, done, defaultTimeout+200*time.Millisecond)
	d := time.Since(start)
	if d < defaultTimeout-30*time.Millisecond {
		t.Fatalf("job finished too early: %v (default %v)", d, defaultTimeout)
	}
}

func TestGoroutineRunner_RunWithTimeout_OverrideApplied(t *testing.T) {
	root := context.Background()
	defaultTimeout := 500 * time.Millisecond
	override := 80 * time.Millisecond
	r := NewGoroutineRunner(root, defaultTimeout)

	start := time.Now()
	done := make(chan struct{})

	r.RunWithTimeout(override, func(ctx context.Context) {
		<-ctx.Done()
		close(done)
	})

	waitClosed(t, done, override+200*time.Millisecond)
	d := time.Since(start)
	if d < override-20*time.Millisecond || d > override+150*time.Millisecond {
		t.Fatalf("job did not respect override timeout: got %v, want around %v", d, override)
	}
}

func TestGoroutineRunner_PanicIsRecovered(t *testing.T) {
	root := context.Background()
	r := NewGoroutineRunner(root, 50*time.Millisecond)

	// If panic is not recovered inside the goroutine, it won't crash the process
	// but we want to at least ensure it doesn't propagate in test execution.
	done := make(chan struct{})
	r.Run(func(ctx context.Context) {
		defer close(done)
		panic("boom")
	})
	waitClosed(t, done, 200*time.Millisecond)
}
