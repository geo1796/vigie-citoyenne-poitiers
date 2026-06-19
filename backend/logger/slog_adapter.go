package logger

import (
	"context"
	"log/slog"
)

type slogAdapter struct {
	inner *slog.Logger
}

func (a slogAdapter) Log(ctx context.Context, level slog.Level, s string, fields ...Entry) {
	a.inner.Log(ctx, level, s, fieldsToAttr(fields)...)
}

func (a slogAdapter) Debug(s string, fields ...Entry) {
	a.inner.Debug(s, fieldsToAttr(fields)...)
}

func (a slogAdapter) Info(s string, fields ...Entry) {
	a.inner.Info(s, fieldsToAttr(fields)...)
}

func (a slogAdapter) Warn(s string, fields ...Entry) {
	a.inner.Warn(s, fieldsToAttr(fields)...)
}

func (a slogAdapter) Error(s string, fields ...Entry) {
	a.inner.Error(s, fieldsToAttr(fields)...)
}

func fieldsToAttr(fields []Entry) []any {
	attrs := make([]any, 0, len(fields)*2)

	for _, f := range fields {
		attrs = append(attrs, f.Key, f.Value)
	}

	return attrs
}
