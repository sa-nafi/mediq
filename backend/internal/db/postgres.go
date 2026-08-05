package db

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sa-nafi/mediq/backend/internal/config"
)

// NewPool initializes and returns a new pgxpool.Pool instance.
func NewPool(ctx context.Context, cfg *config.Config) (*pgxpool.Pool, error) {
	// Build connection string securely
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(cfg.DBUser, cfg.DBPassword),
		Host:   fmt.Sprintf("%s:%s", cfg.DBHost, cfg.DBPort),
		Path:   cfg.DBName,
	}

	q := u.Query()
	q.Set("pool_max_conns", cfg.DBMaxConns)
	q.Set("pool_min_conns", cfg.DBMinConns)
	q.Set("pool_max_conn_lifetime", cfg.DBMaxConnLifetime)
	q.Set("pool_max_conn_idle_time", cfg.DBMaxConnIdleTime)
	u.RawQuery = q.Encode()

	connString := u.String()

	poolCfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database configuration: %w", err)
	}

	slog.Info("Attempting to connect to database",
		"host", cfg.DBHost,
		"port", cfg.DBPort,
		"dbname", cfg.DBName,
		"max_conns", cfg.DBMaxConns,
		"min_conns", cfg.DBMinConns,
	)

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	slog.Info("Successfully connected to database")

	return pool, nil
}
