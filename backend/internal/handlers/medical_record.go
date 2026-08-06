package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type MedicalRecordHandler struct {
	repo *repository.MedicalRecordRepository
}

func NewMedicalRecordHandler(repo *repository.MedicalRecordRepository) *MedicalRecordHandler {
	return &MedicalRecordHandler{repo: repo}
}

type CreateMedicalRecordRequest struct {
	PatientID     int     `json:"patient_id"`
	AppointmentID *int    `json:"appointment_id"`
	Diagnosis     *string `json:"diagnosis"`
	Treatment     *string `json:"treatment"`
	Notes         *string `json:"notes"`
}

func (h *MedicalRecordHandler) CreateMedicalRecordHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateMedicalRecordRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.PatientID == 0 {
		utils.WriteError(w, http.StatusBadRequest, "patient_id is required")
		return
	}

	recordID, err := h.repo.CreateMedicalRecord(
		r.Context(),
		userID,
		req.PatientID,
		req.AppointmentID,
		req.Diagnosis,
		req.Treatment,
		req.Notes,
	)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create medical record")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"record_id": recordID,
		"message":   "Medical record created successfully",
	})
}

func (h *MedicalRecordHandler) GetMedicalRecordsHandler(w http.ResponseWriter, r *http.Request) {
	role, ok := r.Context().Value(middleware.RoleKey).(string)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var filterPatientID *int
	if pidStr := r.URL.Query().Get("patient_id"); pidStr != "" {
		if pid, err := strconv.Atoi(pidStr); err == nil {
			filterPatientID = &pid
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid patient_id query parameter")
			return
		}
	}

	records, err := h.repo.GetMedicalRecords(r.Context(), role, userID, filterPatientID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve medical records")
		return
	}

	utils.WriteJSON(w, http.StatusOK, records)
}

func (h *MedicalRecordHandler) GetMedicalRecordByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	recordID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid record ID")
		return
	}

	role, _ := r.Context().Value(middleware.RoleKey).(string)
	userID, _ := r.Context().Value(middleware.UserIDKey).(int)

	if role == "patient" {
		isOwner, err := h.repo.VerifyRecordOwnership(r.Context(), recordID, userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to verify ownership")
			return
		}
		if !isOwner {
			utils.WriteError(w, http.StatusForbidden, "You do not have permission to view this record")
			return
		}
	}

	record, err := h.repo.GetMedicalRecordByID(r.Context(), recordID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Medical record not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, record)
}
