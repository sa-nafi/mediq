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

func (h *DoctorHandler) GetDoctorSchedulesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	schedules, err := h.repo.GetDoctorSchedules(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve schedules")
		return
	}

	utils.WriteJSON(w, http.StatusOK, schedules)
}

type ScheduleInputJSON struct {
	DayOfWeek   int    `json:"day_of_week"`
	StartTime   string `json:"start_time"` // "15:04:05"
	EndTime     string `json:"end_time"`   // "15:04:05"
	MaxPatients int    `json:"max_patients"`
}

func (h *DoctorHandler) UpdateDoctorSchedulesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	var req []ScheduleInputJSON
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var params []repository.UpdateScheduleParams
	for _, s := range req {
		startTime, err := time.Parse("15:04:05", s.StartTime)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "Invalid start_time format, expected HH:MM:SS")
			return
		}
		endTime, err := time.Parse("15:04:05", s.EndTime)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "Invalid end_time format, expected HH:MM:SS")
			return
		}
		params = append(params, repository.UpdateScheduleParams{
			DayOfWeek:   s.DayOfWeek,
			StartTime:   startTime,
			EndTime:     endTime,
			MaxPatients: s.MaxPatients,
		})
	}

	if err := h.repo.UpdateDoctorSchedules(r.Context(), id, params); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Duplicate schedule for the same day provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update schedules")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Schedules updated successfully"})
}

func (h *DoctorHandler) GetDoctorLeavesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	leaves, err := h.repo.GetDoctorLeaves(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve leaves")
		return
	}

	utils.WriteJSON(w, http.StatusOK, leaves)
}

type CreateLeaveRequest struct {
	LeaveDate string `json:"leave_date"` // "2006-01-02"
}

func (h *DoctorHandler) CreateDoctorLeaveHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	var req CreateLeaveRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	leaveDate, err := time.Parse("2006-01-02", req.LeaveDate)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid leave_date format, expected YYYY-MM-DD")
		return
	}

	if err := h.repo.CreateDoctorLeave(r.Context(), id, leaveDate); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Doctor is already on leave for this date")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create leave")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Leave created successfully"})
}

func (h *DoctorHandler) DeleteDoctorLeaveHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	leaveIDStr := r.PathValue("leave_id")
	leaveID, err := strconv.Atoi(leaveIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid leave ID")
		return
	}

	if err := h.repo.DeleteDoctorLeave(r.Context(), id, leaveID); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Leave not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to delete leave")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Leave deleted successfully"})
}

func (h *DoctorHandler) GetDoctorAvailabilityHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid doctor ID")
		return
	}

	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, 7)

	availableDates, err := h.repo.GetDoctorAvailability(r.Context(), id, startDate, endDate)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to calculate availability")
		return
	}

	resp := map[string]interface{}{
		"doctor_id":       id,
		"window_start":    startDate.Format("2006-01-02"),
		"window_end":      endDate.Format("2006-01-02"),
		"available_dates": availableDates,
	}

	utils.WriteJSON(w, http.StatusOK, resp)
}
