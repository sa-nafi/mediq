package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents the custom JWT claims.
type Claims struct {
	UserID    int    `json:"user_id"`
	PublicID  string `json:"public_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// GenerateTokens creates both access and refresh tokens for a given user.
// Returns access token string, refresh token string, refresh token ID, refresh token expiration, and error.
func GenerateTokens(userID int, publicID, role string, secret []byte) (string, string, string, time.Time, error) {
	// Access Token - Short lived (e.g., 15 minutes)
	expirationTime := time.Now().Add(15 * time.Minute)
	accessID := uuid.New().String()
	claims := &Claims{
		UserID:    userID,
		PublicID:  publicID,
		Role:      role,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        accessID,
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessTokenString, err := accessToken.SignedString(secret)
	if err != nil {
		return "", "", "", time.Time{}, err
	}

	// Refresh Token - Longer lived (e.g., 7 days)
	refreshExpirationTime := time.Now().Add(7 * 24 * time.Hour)
	refreshID := uuid.New().String()
	refreshClaims := &Claims{
		UserID:    userID,
		PublicID:  publicID,
		Role:      role,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        refreshID,
			ExpiresAt: jwt.NewNumericDate(refreshExpirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(secret)
	if err != nil {
		return "", "", "", time.Time{}, err
	}

	return accessTokenString, refreshTokenString, refreshID, refreshExpirationTime, nil
}

// VerifyToken parses and validates a JWT string, returning the custom claims.
func VerifyToken(tokenString string, secret []byte) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
