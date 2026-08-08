package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type PatientHandler struct {
	repo *repository.PatientRepository
}

func NewPatientHandler(repo *repository.PatientRepository) *PatientHandler {
	return &PatientHandler{repo: repo}
}

// GetMyPatientProfileHandler handles GET /api/patients/me
func (h *PatientHandler) GetMyPatientProfileHandler(w http.ResponseWriter, r *http.Request) {
	userIDObj := r.Context().Value(middleware.UserIDKey)
	userID, ok := userIDObj.(int)
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	patient, err := h.repo.GetPatientByUserID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Patient profile not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patient profile")
		return
	}

	utils.WriteJSON(w, http.StatusOK, patient)
}

// UpdateMyPatientProfileHandler handles PUT /api/patients/me
func (h *PatientHandler) UpdateMyPatientProfileHandler(w http.ResponseWriter, r *http.Request) {
	userIDObj := r.Context().Value(middleware.UserIDKey)
	userID, ok := userIDObj.(int)
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	patient, err := h.repo.GetPatientByUserID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Patient profile not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patient profile")
		return
	}

	var req updatePatientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	params := repository.UpdatePatientParams{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Address:   req.Address,
	}

	if err := h.repo.UpdatePatient(r.Context(), patient.ID, params); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update patient profile")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Patient profile updated successfully"})
}

// GetPatientsHandler handles GET /api/patients
func (h *PatientHandler) GetPatientsHandler(w http.ResponseWriter, r *http.Request) {
	searchQuery := r.URL.Query().Get("search")
	page, limit, offset := utils.ParsePaginationParams(r)

	patients, totalCount, err := h.repo.GetAllPatients(r.Context(), searchQuery, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patients")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, patients, totalCount, page, limit)
}

// GetPatientByIDHandler handles GET /api/patients/{id}
func (h *PatientHandler) GetPatientByIDHandler(w http.ResponseWriter, r *http.Request) {
	patientIDStr := r.PathValue("id")
	patientID, err := strconv.Atoi(patientIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid patient ID")
		return
	}

	// Authorization Check
	roleObj := r.Context().Value(middleware.RoleKey)
	userIDObj := r.Context().Value(middleware.UserIDKey)

	role, _ := roleObj.(string)
	userID, ok := userIDObj.(int) 
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	if role == "patient" {
		isOwner, err := h.repo.VerifyPatientOwnership(r.Context(), patientID, userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to verify ownership")
			return
		}
		if !isOwner {
			utils.WriteError(w, http.StatusForbidden, "You can only view your own profile")
			return
		}
	}

	patient, err := h.repo.GetPatientByID(r.Context(), patientID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.WriteError(w, http.StatusNotFound, "Patient not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patient")
		return
	}

	utils.WriteJSON(w, http.StatusOK, patient)
}

type updatePatientRequest struct {
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	Phone     *string `json:"phone"`
	Address   *string `json:"address"`
}

// UpdatePatientHandler handles PUT /api/patients/{id}
func (h *PatientHandler) UpdatePatientHandler(w http.ResponseWriter, r *http.Request) {
	patientIDStr := r.PathValue("id")
	patientID, err := strconv.Atoi(patientIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid patient ID")
		return
	}

	// Authorization Check
	roleObj := r.Context().Value(middleware.RoleKey)
	userIDObj := r.Context().Value(middleware.UserIDKey)

	role, _ := roleObj.(string)
	userID, ok := userIDObj.(int)
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	if role == "patient" {
		isOwner, err := h.repo.VerifyPatientOwnership(r.Context(), patientID, userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to verify ownership")
			return
		}
		if !isOwner {
			utils.WriteError(w, http.StatusForbidden, "You can only update your own profile")
			return
		}
	}

	var req updatePatientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	params := repository.UpdatePatientParams{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Address:   req.Address,
	}

	if err := h.repo.UpdatePatient(r.Context(), patientID, params); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Patient not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update patient")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Patient updated successfully",
	})
}

type CreateWalkInPatientRequest struct {
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	DateOfBirth string  `json:"date_of_birth"` // YYYY-MM-DD
	Gender      *string `json:"gender,omitempty"`
	BloodType   *string `json:"blood_type,omitempty"`
	Phone       *string `json:"phone,omitempty"`
	Address     *string `json:"address,omitempty"`
}

// CreateWalkInPatientHandler handles POST /api/patients/walk-in for receptionists
func (h *PatientHandler) CreateWalkInPatientHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateWalkInPatientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.FirstName == "" || req.LastName == "" || req.DateOfBirth == "" {
		utils.WriteError(w, http.StatusBadRequest, "first_name, last_name, and date_of_birth are required")
		return
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid date format for date_of_birth. Use YYYY-MM-DD")
		return
	}

	patient := &models.Patient{
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		DateOfBirth: dob,
		Gender:      req.Gender,
		BloodType:   req.BloodType,
		Phone:       req.Phone,
		Address:     req.Address,
	}

	patientID, err := h.repo.CreateWalkInPatient(r.Context(), patient)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create walk-in patient")
		return
	}

	createdPatient, err := h.repo.GetPatientByID(r.Context(), patientID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Patient created but failed to retrieve details")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Walk-in patient created successfully",
		"patient": createdPatient,
	})
}
