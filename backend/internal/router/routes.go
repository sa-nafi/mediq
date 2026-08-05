package router

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sa-nafi/mediq/backend/internal/config"
	"github.com/sa-nafi/mediq/backend/internal/handlers"
	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/repository"
)

// RegisterRoutes sets up all the application routes on the given mux
func RegisterRoutes(mux *http.ServeMux, dbPool *pgxpool.Pool, cfg *config.Config) {
	// Repositories
	userRepo := repository.NewUserRepository()
	patientRepo := repository.NewPatientRepository()

	// Handlers
	authHandler := handlers.NewAuthHandler(userRepo, patientRepo, cfg.JWTSecret)

	// Middlewares
	txMw := middleware.TransactionMiddleware(dbPool)

	// Health and readiness endpoints
	mux.HandleFunc("GET /api/health", handlers.HealthCheck)
	mux.HandleFunc("GET /api/ready", handlers.ReadyHandler(dbPool))

	// Auth routes (wrapped in transaction middleware)
	mux.Handle("POST /api/auth/register", txMw(http.HandlerFunc(authHandler.RegisterPatientHandler)))
	mux.Handle("POST /api/auth/login", txMw(http.HandlerFunc(authHandler.LoginHandler)))
	mux.Handle("POST /api/auth/refresh", txMw(http.HandlerFunc(authHandler.RefreshTokenHandler)))
	
	// Protected Auth routes
	authMw := middleware.RequireAuth(cfg.JWTSecret)
	mux.Handle("POST /api/auth/logout", authMw(txMw(http.HandlerFunc(authHandler.LogoutHandler))))
}
