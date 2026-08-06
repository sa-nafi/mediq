package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type DoctorHandler struct {
	repo *repository.DoctorRepository
}

func NewDoctorHandler(repo *repository.DoctorRepository) *DoctorHandler {
	return &DoctorHandler{repo: repo}
}

type CreateDoctorRequest struct {
	Email           string  `json:"email"`
	Password        string  `json:"password"`
	DepartmentID    *int    `json:"department_id"`
	FirstName       string  `json:"first_name"`
	LastName        string  `json:"last_name"`
	Phone           *string `json:"phone"`
	HireDate        string  `json:"hire_date"`
	Specialization  *string `json:"specialization"`
	LicenseNumber   string  `json:"license_number"`
	ConsultationFee float64 `json:"consultation_fee"`
}

func (h *DoctorHandler) CreateDoctorHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateDoctorRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	var parsedHireDate time.Time
	if req.HireDate != "" {
		parsedHireDate, err = time.Parse("2006-01-02", req.HireDate)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "Invalid hire_date format, expected YYYY-MM-DD")
			return
		}
	} else {
		parsedHireDate = time.Now()
	}

	params := repository.CreateDoctorParams{
		Email:           req.Email,
		PasswordHash:    hash,
		DepartmentID:    req.DepartmentID,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Phone:           req.Phone,
		HireDate:        parsedHireDate,
		Specialization:  req.Specialization,
		LicenseNumber:   req.LicenseNumber,
		ConsultationFee: req.ConsultationFee,
	}

	if err := h.repo.CreateDoctor(r.Context(), params); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Doctor with this email or license number already exists")
			return
		}
		if errors.Is(err, utils.ErrInvalidReference) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid department ID provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create doctor")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Doctor created successfully"})
}

func (h *DoctorHandler) GetDoctorsHandler(w http.ResponseWriter, r *http.Request) {
	page, limit, offset := utils.ParsePaginationParams(r)

	doctors, totalCount, err := h.repo.GetAllDoctors(r.Context(), limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve doctors")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, doctors, totalCount, page, limit)
}

func (h *DoctorHandler) GetDoctorByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	doctor, err := h.repo.GetDoctorByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Doctor not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, doctor)
}

type UpdateDoctorRequest struct {
	DepartmentID    *int    `json:"department_id"`
	FirstName       string  `json:"first_name"`
	LastName        string  `json:"last_name"`
	Phone           *string `json:"phone"`
	Specialization  *string `json:"specialization"`
	ConsultationFee float64 `json:"consultation_fee"`
}

func (h *DoctorHandler) UpdateDoctorHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	var req UpdateDoctorRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	params := repository.UpdateDoctorParams{
		DepartmentID:    req.DepartmentID,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Phone:           req.Phone,
		Specialization:  req.Specialization,
		ConsultationFee: req.ConsultationFee,
	}

	if err := h.repo.UpdateDoctor(r.Context(), id, params); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Doctor not found")
			return
		}
		if errors.Is(err, utils.ErrInvalidReference) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid department ID provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update doctor")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Doctor updated successfully"})
}

func (h *DoctorHandler) DeleteDoctorHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	if err := h.repo.DeactivateUserByDoctorID(r.Context(), id); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Doctor not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to delete doctor")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Doctor deactivated successfully"})
}
