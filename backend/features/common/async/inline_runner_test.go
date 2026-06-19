package async

import (
	"context"
	"testing"
	"time"
)

func TestInlineRunner_Run_BlocksUntilTimeout(t *testing.T) {
	root := context.Background()
	defaultTimeout := 90 * time.Millisecond
	r := NewInlineRunner(root, defaultTimeout)

	start := time.Now()
	r.Run(func(ctx context.Context) {
		<-ctx.Done()
	})
	d := time.Since(start)
	if d < defaultTimeout-20*time.Millisecond {
		t.Fatalf("inline run returned too early: %v (default %v)", d, defaultTimeout)
	}
}

func TestInlineRunner_RunWithTimeout_OverrideAndFallback(t *testing.T) {
	root := context.Background()
	defaultTimeout := 120 * time.Millisecond
	r := NewInlineRunner(root, defaultTimeout)

	// Override shorter than default
	start := time.Now()
	r.RunWithTimeout(50*time.Millisecond, func(ctx context.Context) {
		<-ctx.Done()
	})
	d := time.Since(start)
	if d < 30*time.Millisecond || d > 200*time.Millisecond {
		t.Fatalf("override not applied correctly: got %v", d)
	}

	// Non-positive override should fallback to default
	start = time.Now()
	r.RunWithTimeout(0, func(ctx context.Context) {
		<-ctx.Done()
	})
	d = time.Since(start)
	if d < defaultTimeout-20*time.Millisecond {
		t.Fatalf("fallback to default timeout failed: got %v, want around %v", d, defaultTimeout)
	}
}

func TestInlineRunner_PanicIsRecovered(t *testing.T) {
	root := context.Background()
	r := NewInlineRunner(root, 50*time.Millisecond)

	// Should not panic despite panic in job
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("panic should have been recovered inside runner, got %v", r)
		}
	}()

	r.Run(func(ctx context.Context) {
		panic("boom")
	})
}
