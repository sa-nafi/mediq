package router

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sa-nafi/mediq/backend/internal/handlers"
)

// RegisterRoutes sets up all the application routes on the given mux
func RegisterRoutes(mux *http.ServeMux, dbPool *pgxpool.Pool) {
	mux.HandleFunc("GET /api/health", handlers.HealthCheck)
	mux.HandleFunc("GET /api/ready", handlers.ReadyHandler(dbPool))
}
