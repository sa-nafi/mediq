package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ReadyResponse represents the readiness check response.
type ReadyResponse struct {
	Status string            `json:"status"`
	Checks map[string]string `json:"checks"`
}

// NewReadyHandler returns an http.HandlerFunc that checks database connectivity.
func ReadyHandler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		err := pool.Ping(r.Context())
		if err != nil {
			slog.Error("Readiness check failed", "error", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			response := ReadyResponse{
				Status: "ok",
				Checks: map[string]string{
					"postgres": "unavailable",
				},
			}
			if err := json.NewEncoder(w).Encode(response); err != nil {
				slog.Error("Failed to write ready check response", "error", err)
			}
			return
		}

		w.WriteHeader(http.StatusOK)
		response := ReadyResponse{
			Status: "ok",
			Checks: map[string]string{
				"postgres": "ok",
			},
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			slog.Error("Failed to write ready check response", "error", err)
		}
	}
}
