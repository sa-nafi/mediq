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

type AppointmentHandler struct {
	repo *repository.AppointmentRepository
}

func NewAppointmentHandler(repo *repository.AppointmentRepository) *AppointmentHandler {
	return &AppointmentHandler{repo: repo}
}

type createAppointmentRequest struct {
	DoctorID        int    `json:"doctor_id"`
	AppointmentDate string `json:"appointment_date"` // YYYY-MM-DD format
	Type            string `json:"type"`
}

// CreateAppointmentHandler handles POST /api/appointments
func (h *AppointmentHandler) CreateAppointmentHandler(w http.ResponseWriter, r *http.Request) {
	// Role check handled by middleware (patient only)
	userIDObj := r.Context().Value(middleware.UserIDKey)
	userID, ok := userIDObj.(int)
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	patientID, err := h.repo.GetPatientIDByUserID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.WriteError(w, http.StatusNotFound, "Patient profile not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patient profile")
		return
	}

	var req createAppointmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.DoctorID == 0 {
		utils.WriteError(w, http.StatusBadRequest, "Doctor ID is required")
		return
	}

	date, err := time.Parse("2006-01-02", req.AppointmentDate)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid date format, expected YYYY-MM-DD")
		return
	}

	if req.Type != string(models.TypeNew) && req.Type != string(models.TypeFollowUp) && req.Type != string(models.TypeReport) {
		utils.WriteError(w, http.StatusBadRequest, "Invalid appointment type. Must be 'new', 'follow-up', or 'report'")
		return
	}

	appointmentID, err := h.repo.BookAppointment(r.Context(), patientID, req.DoctorID, date, req.Type)
	if err != nil {
		// Postgres raised exceptions (e.g., limit reached, on leave, etc.)
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"appointment_id": appointmentID,
		"message":        "Appointment booked successfully",
	})
}

// GetAppointmentsHandler handles GET /api/appointments
func (h *AppointmentHandler) GetAppointmentsHandler(w http.ResponseWriter, r *http.Request) {
	roleObj := r.Context().Value(middleware.RoleKey)
	userIDObj := r.Context().Value(middleware.UserIDKey)

	role, _ := roleObj.(string)
	userID, ok := userIDObj.(int)
	if !ok {
		utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
		return
	}

	page, limit, offset := utils.ParsePaginationParams(r)

	appointments, totalCount, err := h.repo.GetAppointments(r.Context(), role, userID, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve appointments")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, appointments, totalCount, page, limit)
}

// GetAppointmentByIDHandler handles GET /api/appointments/{id}
func (h *AppointmentHandler) GetAppointmentByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	appointmentID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid appointment ID")
		return
	}

	appointment, err := h.repo.GetAppointmentByID(r.Context(), appointmentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.WriteError(w, http.StatusNotFound, "Appointment not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve appointment")
		return
	}

	// We can perform an ownership check here if we want to restrict patients to their own appointments.
	// Since GetAppointments already filters based on role, it's good practice to secure the single fetch too.
	roleObj := r.Context().Value(middleware.RoleKey)
	role, _ := roleObj.(string)
	
	if role == "patient" {
		userIDObj := r.Context().Value(middleware.UserIDKey)
		userID, ok := userIDObj.(int)
		if !ok {
			utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
			return
		}
		patientID, err := h.repo.GetPatientIDByUserID(r.Context(), userID)
		if err != nil || appointment.PatientID != patientID {
			utils.WriteError(w, http.StatusForbidden, "You can only view your own appointments")
			return
		}
	} else if role == "doctor" {
		// Just to be fully secure, a doctor shouldn't see other doctors' appointments.
		// However, for simplicity and typical hospital systems, a doctor might see others' schedules or only theirs.
		// We can leave this open for doctor/receptionist or implement strict checks. We will trust the receptionist/admin and enforce strict on patient.
	}

	utils.WriteJSON(w, http.StatusOK, appointment)
}

// CancelAppointmentHandler handles PUT /api/appointments/{id}/cancel
func (h *AppointmentHandler) CancelAppointmentHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	appointmentID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid appointment ID")
		return
	}

	// Same ownership check for patient
	roleObj := r.Context().Value(middleware.RoleKey)
	role, _ := roleObj.(string)
	
	if role == "patient" {
		userIDObj := r.Context().Value(middleware.UserIDKey)
		userID, ok := userIDObj.(int)
		if !ok {
			utils.WriteError(w, http.StatusInternalServerError, "invalid user ID type in context")
			return
		}
		patientID, err := h.repo.GetPatientIDByUserID(r.Context(), userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve patient profile")
			return
		}
		appointment, err := h.repo.GetAppointmentByID(r.Context(), appointmentID)
		if err != nil || appointment.PatientID != patientID {
			utils.WriteError(w, http.StatusForbidden, "You can only cancel your own appointments")
			return
		}
	}

	err = h.repo.CancelAppointment(r.Context(), appointmentID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Appointment cancelled successfully"})
}

type updateAppointmentStatusRequest struct {
	Status string `json:"status"`
}

// UpdateAppointmentStatusHandler handles PATCH /api/appointments/{id}/status
func (h *AppointmentHandler) UpdateAppointmentStatusHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	appointmentID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid appointment ID")
		return
	}

	var req updateAppointmentStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Status != string(models.StatusCompleted) && req.Status != string(models.StatusNoShow) && req.Status != string(models.StatusCancelled) {
		utils.WriteError(w, http.StatusBadRequest, "Invalid status. Must be completed, cancelled, or no_show")
		return
	}

	err = h.repo.UpdateAppointmentStatus(r.Context(), appointmentID, req.Status)
	if err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Appointment not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update appointment status")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Appointment status updated successfully"})
}
