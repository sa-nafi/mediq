package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// HealthCheck handles the GET /api/health endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]string{
		"status":  "ok",
		"message": "server is running",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Error("Failed to write health check response", "error", err)
	}
}
