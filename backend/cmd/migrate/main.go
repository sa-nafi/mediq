package main

import (
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	"github.com/sa-nafi/mediq/backend/internal/config"
	"github.com/sa-nafi/mediq/backend/internal/db"
)

func main() {
	// Initialize structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	// Build connection string securely with pgx5 scheme for golang-migrate
	u := &url.URL{
		Scheme: "pgx5",
		User:   url.UserPassword(cfg.DBUser, cfg.DBPassword),
		Host:   fmt.Sprintf("%s:%s", cfg.DBHost, cfg.DBPort),
		Path:   cfg.DBName,
	}
	dbURL := u.String()

	migrationsPath := "file://migrations"

	// Initialize migrator
	migrator, err := db.NewMigrator(dbURL, migrationsPath)
	if err != nil {
		slog.Error("Failed to initialize database migrator", "error", err)
		os.Exit(1)
	}
	defer migrator.Close()

	flag.Usage = func() {
		fmt.Println("Usage: migrate <command> [args]")
		fmt.Println("Commands:")
		fmt.Println("  up        Apply all pending migrations")
		fmt.Println("  down      Roll back the latest migration")
		fmt.Println("  version   Show current migration version")
		fmt.Println("  force <v> Force set migration version to <v>")
		os.Exit(1)
	}
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		flag.Usage()
	}

	command := args[0]
	slog.Info("Running migration command", "command", command, "source", migrationsPath)

	switch command {
	case "up":
		if err := migrator.Up(); err != nil {
			if errors.Is(err, migrate.ErrNoChange) {
				slog.Info("Database is already up to date")
			} else {
				slog.Error("Failed to run migrations up", "error", err)
				os.Exit(1)
			}
		} else {
			slog.Info("Migration completed successfully")
		}

	case "down":
		if err := migrator.Down(); err != nil {
			if errors.Is(err, migrate.ErrNoChange) {
				slog.Info("No migrations to rollback (already at version 0)")
			} else {
				slog.Error("Failed to run migrations down", "error", err)
				os.Exit(1)
			}
		} else {
			slog.Info("Rollback completed successfully")
		}

	case "version":
		version, dirty, err := migrator.Version()
		if err != nil {
			slog.Error("Failed to get migration version", "error", err)
			os.Exit(1)
		}
		if version == 0 && !dirty {
			slog.Info("Database has no migrations applied yet", "version", version, "dirty", dirty)
		} else {
			slog.Info("Current database state", "version", version, "dirty", dirty)
		}

	case "force":
		if len(args) < 2 {
			slog.Error("Force command requires a version number")
			fmt.Println("Example: migrate force 3")
			os.Exit(1)
		}
		versionStr := args[1]
		version, err := strconv.Atoi(versionStr)
		if err != nil || version < 0 {
			slog.Error("Invalid version number", "provided", versionStr)
			os.Exit(1)
		}

		if err := migrator.Force(version); err != nil {
			slog.Error("Failed to force migration version", "error", err)
			os.Exit(1)
		}
		slog.Info("Forcefully set migration version", "version", version)

	default:
		slog.Error("Invalid command", "command", command)
		flag.Usage()
	}
}
