package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

// AuthHandler groups all authentication-related HTTP handlers.
type AuthHandler struct {
	userRepo    *repository.UserRepository
	patientRepo *repository.PatientRepository
	jwtSecret   string
}

// NewAuthHandler initializes the AuthHandler.
func NewAuthHandler(ur *repository.UserRepository, pr *repository.PatientRepository, secret string) *AuthHandler {
	return &AuthHandler{
		userRepo:    ur,
		patientRepo: pr,
		jwtSecret:   secret,
	}
}

// RegisterPatientRequest defines the JSON payload for patient registration.
type RegisterPatientRequest struct {
	Email       string  `json:"email"`
	Password    string  `json:"password"`
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	DateOfBirth string  `json:"date_of_birth"`
	Gender      *string `json:"gender,omitempty"`
	BloodType   *string `json:"blood_type,omitempty"`
	Phone       *string `json:"phone,omitempty"`
	Address     *string `json:"address,omitempty"`
}

// RegisterPatientHandler handles POST /auth/register
func (h *AuthHandler) RegisterPatientHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterPatientRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" || req.DateOfBirth == "" {
		utils.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	// Validate date format before passing to repository
	parsedDOB, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid date_of_birth format, expected YYYY-MM-DD")
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	params := repository.RegisterPatientParams{
		Email:        req.Email,
		PasswordHash: hash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  parsedDOB,
		Gender:       req.Gender,
		BloodType:    req.BloodType,
		Phone:        req.Phone,
		Address:      req.Address,
	}

	err = h.patientRepo.RegisterPatient(r.Context(), params)
	if err != nil {
		if errors.Is(err, utils.ErrDuplicateEmail) {
			utils.WriteError(w, http.StatusConflict, "Email is already registered")
		} else {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to register patient")
		}
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Patient registered successfully"})
}

// LoginRequest defines the JSON payload for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse defines the JSON response containing the tokens.
type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// LoginHandler handles POST /auth/login
func (h *AuthHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.userRepo.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.WriteError(w, http.StatusUnauthorized, "Invalid credentials")
		} else {
			utils.WriteError(w, http.StatusInternalServerError, "Database error")
		}
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if !user.IsActive {
		utils.WriteError(w, http.StatusForbidden, "Account is disabled")
		return
	}

	access, refresh, refreshID, refreshExp, err := utils.GenerateTokens(user.ID, user.PublicID.String(), user.Role, []byte(h.jwtSecret))
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	if err := h.userRepo.StoreRefreshToken(r.Context(), refreshID, user.ID, refreshExp); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	utils.WriteJSON(w, http.StatusOK, LoginResponse{
		AccessToken:  access,
		RefreshToken: refresh,
	})
}

// RefreshRequest defines the JSON payload for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// RefreshResponse returns the new access token and a rotated refresh token.
type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshTokenHandler handles POST /api/auth/refresh
func (h *AuthHandler) RefreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	claims, err := utils.VerifyToken(req.RefreshToken, []byte(h.jwtSecret))
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	if claims.TokenType != "refresh" {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid token type, expected refresh token")
		return
	}

	// Revoke old token atomically (also checks if it was already revoked)
	revoked, err := h.userRepo.RevokeRefreshToken(r.Context(), claims.ID, claims.UserID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to revoke token")
		return
	}
	if !revoked {
		utils.WriteError(w, http.StatusUnauthorized, "Refresh token is revoked or invalid")
		return
	}

	// Generate new tokens
	access, refresh, refreshID, refreshExp, err := utils.GenerateTokens(claims.UserID, claims.PublicID, claims.Role, []byte(h.jwtSecret))
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Store new token
	if err := h.userRepo.StoreRefreshToken(r.Context(), refreshID, claims.UserID, refreshExp); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	utils.WriteJSON(w, http.StatusOK, RefreshResponse{
		AccessToken:  access,
		RefreshToken: refresh,
	})
}

// LogoutRequest defines the JSON payload for logout.
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// LogoutHandler handles POST /api/auth/logout
func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	var req LogoutRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	claims, err := utils.VerifyToken(req.RefreshToken, []byte(h.jwtSecret))
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	if claims.TokenType != "refresh" {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid token type, expected refresh token")
		return
	}

	// Revoke the token using the existing repository method
	revoked, err := h.userRepo.RevokeRefreshToken(r.Context(), claims.ID, claims.UserID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to revoke token")
		return
	}
	if !revoked {
		utils.WriteError(w, http.StatusUnauthorized, "Refresh token is already revoked or invalid")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}
