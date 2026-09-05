package telemetry

import (
	"context"
	"log/slog"

	"go.opentelemetry.io/otel/trace"
)

// TraceContextHandler wraps a slog.Handler to inject trace_id and span_id attributes
// from the active OpenTelemetry span into the log record.
type TraceContextHandler struct {
	handler slog.Handler
}

// NewTraceContextHandler creates a new TraceContextHandler wrapping the provided handler.
func NewTraceContextHandler(h slog.Handler) *TraceContextHandler {
	return &TraceContextHandler{handler: h}
}

// Enabled reports whether the handler handles records at the given level.
func (h *TraceContextHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.handler.Enabled(ctx, level)
}

// Handle extracts trace_id and span_id from ctx and delegates to the underlying handler.
func (h *TraceContextHandler) Handle(ctx context.Context, r slog.Record) error {
	if ctx != nil {
		span := trace.SpanFromContext(ctx)
		if span.SpanContext().IsValid() {
			r.AddAttrs(
				slog.String("trace_id", span.SpanContext().TraceID().String()),
				slog.String("span_id", span.SpanContext().SpanID().String()),
			)
		}
	}
	return h.handler.Handle(ctx, r)
}

// WithAttrs returns a new handler with the given attributes added.
func (h *TraceContextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &TraceContextHandler{handler: h.handler.WithAttrs(attrs)}
}

// WithGroup returns a new handler with the given group name appended.
func (h *TraceContextHandler) WithGroup(name string) slog.Handler {
	return &TraceContextHandler{handler: h.handler.WithGroup(name)}
}
