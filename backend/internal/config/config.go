package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

// Config holds the application configuration.
type Config struct {
	ServerPort        string
	DBHost            string
	DBPort            string
	DBUser            string
	DBPassword        string
	DBName            string
	DBMaxConns        string
	DBMinConns        string
	DBMaxConnLifetime string
	DBMaxConnIdleTime string
	JWTSecret         string
	CORSAllowedOrigin string
	CookieSecure      bool
	OTLPEndpoint      string
	OTLPInsecure      bool
	ServiceName       string
	Environment       string
	MetricsEnabled    bool
	TracingEnabled    bool
}

// Load loads configuration from environment variables, optionally reading from a .env file first.
func Load() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			slog.Warn(".env file not found, continuing with system environment variables")
		} else {
			slog.Warn("Error loading .env file", "error", err)
		}
	}

	cfg := &Config{
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "5432"),
		DBUser:            getEnv("DB_USER", ""),
		DBPassword:        getEnv("DB_PASSWORD", ""),
		DBName:            getEnv("DB_NAME", ""),
		DBMaxConns:        getEnv("DB_MAX_CONNS", "10"),
		DBMinConns:        getEnv("DB_MIN_CONNS", "2"),
		DBMaxConnLifetime: getEnv("DB_MAX_CONN_LIFETIME", "1h"),
		DBMaxConnIdleTime: getEnv("DB_MAX_CONN_IDLE_TIME", "30m"),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		CORSAllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		CookieSecure:      getEnv("COOKIE_SECURE", "false") == "true",
		OTLPEndpoint:      getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		OTLPInsecure:      getEnv("OTEL_EXPORTER_OTLP_INSECURE", "true") == "true",
		ServiceName:       getEnv("OTEL_SERVICE_NAME", "mediq-backend"),
		Environment:       getEnv("OTEL_ENVIRONMENT", "development"),
		MetricsEnabled:    getEnv("METRICS_ENABLED", "true") == "true",
		TracingEnabled:    getEnv("TRACING_ENABLED", "true") == "true",
	}

	if err := validate(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func validate(cfg *Config) error {
	var missing []string

	if cfg.DBUser == "" {
		missing = append(missing, "DB_USER")
	}
	if cfg.DBPassword == "" {
		missing = append(missing, "DB_PASSWORD")
	}
	if cfg.DBName == "" {
		missing = append(missing, "DB_NAME")
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if cfg.CORSAllowedOrigin == "" {
		missing = append(missing, "ALLOWED_ORIGIN")
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %v", missing)
	}

	return nil
}
