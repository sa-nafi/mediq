package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user account in the system.
// It maps to the "users" database table.
type User struct {
	ID           int       `json:"-"`
	PublicID     uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}
