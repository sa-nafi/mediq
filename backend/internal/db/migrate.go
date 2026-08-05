package db

import (
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// Migrator wraps the golang-migrate instance.
type Migrator struct {
	m *migrate.Migrate
}

// NewMigrator initializes a new Migrator instance.
// dbURL should be a valid postgres URL with the pgx5 scheme (e.g. pgx5://user:pass@host:port/dbname?sslmode=disable).
// migrationsPath should be the path to the migrations directory, e.g. "file://migrations".
func NewMigrator(dbURL string, migrationsPath string) (*Migrator, error) {
	m, err := migrate.New(migrationsPath, dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize migrator: %w", err)
	}

	return &Migrator{m: m}, nil
}

// Up runs all pending migrations.
func (mig *Migrator) Up() error {
	err := mig.m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			return err // handled gracefully by caller
		}
		return fmt.Errorf("failed to run migrations up: %w", err)
	}
	return nil
}

// Down rolls back the latest migration.
func (mig *Migrator) Down() error {
	err := mig.m.Steps(-1)
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			return err
		}
		return fmt.Errorf("failed to run migrations down: %w", err)
	}
	return nil
}

// Version returns the current migration version and dirty state.
func (mig *Migrator) Version() (uint, bool, error) {
	version, dirty, err := mig.m.Version()
	if err != nil {
		if errors.Is(err, migrate.ErrNilVersion) {
			return 0, false, nil // Database has no migrations applied yet
		}
		return 0, false, fmt.Errorf("failed to get migration version: %w", err)
	}
	return version, dirty, nil
}

// Force sets the migration version forcefully, useful for recovering from dirty states.
func (mig *Migrator) Force(version int) error {
	err := mig.m.Force(version)
	if err != nil {
		return fmt.Errorf("failed to force migration version: %w", err)
	}
	return nil
}

// Close closes the underlying migrate instance.
func (mig *Migrator) Close() error {
	_, err := mig.m.Close()
	return err
}
