package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/sa-nafi/mediq/backend/internal/telemetry"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
)

// TelemetryMiddleware wraps HTTP handlers with OpenTelemetry distributed tracing
// and Prometheus RED metrics collection (Rate, Errors, Duration).
func TelemetryMiddleware(next http.Handler) http.Handler {
	tracer := otel.Tracer("mediq/http")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract existing trace context from incoming HTTP headers
		ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

		// 2. Start OpenTelemetry span
		spanName := fmt.Sprintf("HTTP %s %s", r.Method, r.URL.Path)
		ctx, span := tracer.Start(ctx, spanName,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				semconv.HTTPRequestMethodKey.String(r.Method),
				semconv.URLPath(r.URL.Path),
				semconv.UserAgentOriginal(r.UserAgent()),
				semconv.ClientAddress(r.RemoteAddr),
			),
		)
		defer span.End()

		// 3. Track in-flight request
		telemetry.HTTPRequestsInFlight.WithLabelValues(r.Method).Inc()
		defer telemetry.HTTPRequestsInFlight.WithLabelValues(r.Method).Dec()

		start := time.Now()
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		// 4. Delegate to the next handler with the trace-enriched context
		defer func() {
			duration := time.Since(start)
			statusCode := recorder.status
			statusCodeStr := strconv.Itoa(statusCode)

			// Determine route pattern label (prefer matched Go 1.22+ pattern to avoid high cardinality)
			pathLabel := r.Pattern
			if pathLabel != "" {
				// Strip method if included in pattern (e.g. "GET /api/doctors/{id}" -> "/api/doctors/{id}")
				if parts := strings.SplitN(pathLabel, " ", 2); len(parts) == 2 {
					pathLabel = parts[1]
				}
			} else {
				pathLabel = r.URL.Path
			}

			// Update span status and attributes
			span.SetAttributes(
				semconv.HTTPResponseStatusCode(statusCode),
				attribute.String("http.route", pathLabel),
			)
			if statusCode >= 500 {
				span.SetStatus(codes.Error, fmt.Sprintf("HTTP error %d", statusCode))
			} else {
				span.SetStatus(codes.Ok, "OK")
			}

			// Record Prometheus metrics with trace exemplar if available
			traceID := span.SpanContext().TraceID().String()
			observer := telemetry.HTTPRequestDuration.WithLabelValues(r.Method, pathLabel, statusCodeStr)
			if exObserver, ok := observer.(prometheus.ExemplarObserver); ok && traceID != "" {
				exObserver.ObserveWithExemplar(duration.Seconds(), prometheus.Labels{"trace_id": traceID})
			} else {
				observer.Observe(duration.Seconds())
			}

			telemetry.HTTPRequestsTotal.WithLabelValues(r.Method, pathLabel, statusCodeStr).Inc()
		}()

		next.ServeHTTP(recorder, r.WithContext(ctx))
	})
}
