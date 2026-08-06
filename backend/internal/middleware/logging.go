package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// LoggingMiddleware logs all incoming HTTP requests including their latency and status code.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Reuse statusRecorder from transaction.go to capture the status code
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		defer func() {
			// If a panic occurred, ensure we log a 500 status
			if err := recover(); err != nil {
				recorder.status = http.StatusInternalServerError

				// Log the panicking request
				slog.Error("Request panicked",
					slog.String("method", r.Method),
					slog.String("path", r.URL.RequestURI()),
					slog.String("remote_addr", r.RemoteAddr),
					slog.Int("status", recorder.status),
					// slog.Duration("duration", time.Since(start)),
					slog.String("duration", time.Since(start).String()),
					slog.Any("panic_error", err),
				)
				panic(err) // Re-throw to the http.Server
			}

			// Normal execution logging
			slog.Info("Request completed",
				slog.String("method", r.Method),
				slog.String("path", r.URL.RequestURI()),
				slog.String("remote_addr", r.RemoteAddr),
				slog.Int("status", recorder.status),
				// slog.Duration("duration", time.Since(start)),
				slog.String("duration", time.Since(start).String()),
			)
		}()

		next.ServeHTTP(recorder, r)
	})
}
