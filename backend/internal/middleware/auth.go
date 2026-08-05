package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/sa-nafi/mediq/backend/internal/utils"
)

// contextKey is a custom type to avoid context key collisions.
type contextKey string

const (
	// UserIDKey is the context key for the authenticated user's ID.
	UserIDKey contextKey = "user_id"
	// RoleKey is the context key for the authenticated user's Role.
	RoleKey contextKey = "role"
)

// RequireAuth extracts and verifies the JWT token from the Authorization header.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.WriteError(w, http.StatusUnauthorized, "missing authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				utils.WriteError(w, http.StatusUnauthorized, "invalid authorization header format")
				return
			}

			tokenString := parts[1]
			claims, err := utils.VerifyToken(tokenString, []byte(jwtSecret))
			if err != nil {
				utils.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			if claims.TokenType != "access" {
				utils.WriteError(w, http.StatusUnauthorized, "invalid token type, expected access token")
				return
			}

			// Add parsed claims to the request context
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, RoleKey, claims.Role)

			// Call the next handler in the chain with the new context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole restricts access to users possessing one of the allowed roles.
// It assumes RequireAuth has already run and populated the context.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roleObj := r.Context().Value(RoleKey)
			if roleObj == nil {
				utils.WriteError(w, http.StatusUnauthorized, "user role not found in context")
				return
			}

			userRole, ok := roleObj.(string)
			if !ok {
				utils.WriteError(w, http.StatusInternalServerError, "invalid role type in context")
				return
			}

			hasRole := false
			for _, role := range allowedRoles {
				if userRole == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				utils.WriteError(w, http.StatusForbidden, "insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
