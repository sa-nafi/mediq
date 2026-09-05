package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/config"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/router"
	"github.com/sa-nafi/mediq/backend/internal/telemetry"
)

func main() {
	// Initialize base structured logging
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	logger := slog.New(telemetry.NewTraceContextHandler(jsonHandler))
	slog.SetDefault(logger)

	slog.Info("Starting application")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	slog.Info("Loaded configuration", "port", cfg.ServerPort, "db_host", cfg.DBHost, "db_name", cfg.DBName)

	// Initialize OpenTelemetry tracer
	shutdownTracer, err := telemetry.InitTracer(context.Background(), cfg)
	if err != nil {
		slog.Error("Failed to initialize OpenTelemetry tracer", "error", err)
		os.Exit(1)
	}
	defer func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()
		if err := shutdownTracer(shutdownCtx); err != nil {
			slog.Error("Failed to shutdown tracer cleanly", "error", err)
		}
	}()

	// Initialize database pool
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer dbCancel()

	dbPool, err := db.NewPool(dbCtx, cfg)
	if err != nil {
		slog.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}

	// Register DB pool metrics with Prometheus if enabled
	if cfg.MetricsEnabled {
		telemetry.RegisterDBPoolMetrics(dbPool)
	}

	// Initialize router
	mux := http.NewServeMux()

	// Register routes
	router.RegisterRoutes(mux, dbPool, cfg)

	// Configure server handler chain: Telemetry -> Logging -> CORS -> Mux
	handler := middleware.TelemetryMiddleware(
		middleware.LoggingMiddleware(
			middleware.CORS(cfg.CORSAllowedOrigin)(mux),
		),
	)

	// Configure server
	addr := ":" + cfg.ServerPort
	srv := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadTimeout:       5 * time.Second,
		ReadHeaderTimeout: 2 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("Server listening", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("HTTP server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	slog.Info("Received shutdown signal", "signal", sig.String())

	// Shutdown with a timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	slog.Info("Shutting down server gracefully...")
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server shutdown failed", "error", err)
		os.Exit(1)
	}

	slog.Info("Closing database pool...")
	dbPool.Close()

	slog.Info("Server stopped cleanly")
}
