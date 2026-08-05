package repository

import (
	"context"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
)

// UserRepository handles database operations for users.
type UserRepository struct{}

// NewUserRepository returns a new instance of UserRepository.
func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

// GetUserByEmail fetches a user by their email address.
func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	tx := db.TxFromContext(ctx)

	query := `
		SELECT user_id, public_id, email, password_hash, role, is_active, created_at 
		FROM Users 
		WHERE email = $1
	`
	var user models.User
	err := tx.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.PublicID,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// StoreRefreshToken stores a newly issued refresh token in the database.
func (r *UserRepository) StoreRefreshToken(ctx context.Context, tokenID string, userID int, expiresAt time.Time) error {
	tx := db.TxFromContext(ctx)
	query := `
		INSERT INTO Refresh_Tokens (token_id, user_id, expires_at)
		VALUES ($1, $2, $3)
	`
	_, err := tx.Exec(ctx, query, tokenID, userID, expiresAt)
	return err
}

// RevokeRefreshToken marks a refresh token as revoked atomically.
// Returns true if the token was successfully revoked, or false if it was already revoked or doesn't exist.
func (r *UserRepository) RevokeRefreshToken(ctx context.Context, tokenID string, userID int) (bool, error) {
	tx := db.TxFromContext(ctx)
	query := `
		UPDATE Refresh_Tokens
		SET is_revoked = TRUE
		WHERE token_id = $1 AND user_id = $2 AND is_revoked = FALSE
	`
	tag, err := tx.Exec(ctx, query, tokenID, userID)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}
