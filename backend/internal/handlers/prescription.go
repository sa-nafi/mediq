package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type PrescriptionHandler struct {
	repo *repository.PrescriptionRepository
}

func NewPrescriptionHandler(repo *repository.PrescriptionRepository) *PrescriptionHandler {
	return &PrescriptionHandler{repo: repo}
}

func (h *PrescriptionHandler) CreatePrescriptionHandler(w http.ResponseWriter, r *http.Request) {
	doctorID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreatePrescriptionRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.RecordID == 0 || len(req.Items) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "record_id and at least one item are required")
		return
	}

	prescriptionID, err := h.repo.CreatePrescription(r.Context(), doctorID, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create prescription")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"prescription_id": prescriptionID,
		"message":         "Prescription created successfully",
	})
}

func (h *PrescriptionHandler) GetPrescriptionByIDHandler(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(int)
	role, _ := r.Context().Value(middleware.RoleKey).(string)

	idStr := r.PathValue("id")
	prescriptionID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid prescription ID")
		return
	}

	if role == "patient" {
		isOwner, err := h.repo.VerifyPrescriptionOwnership(r.Context(), prescriptionID, userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to verify ownership")
			return
		}
		if !isOwner {
			utils.WriteError(w, http.StatusForbidden, "Access denied")
			return
		}
	}

	detail, err := h.repo.GetPrescriptionByID(r.Context(), prescriptionID)
	if err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Prescription not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve prescription")
		return
	}

	utils.WriteJSON(w, http.StatusOK, detail)
}

func (h *PrescriptionHandler) GetPrescriptionsHandler(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(int)
	role, _ := r.Context().Value(middleware.RoleKey).(string)

	var filterUserID *int
	var filterPatientID *int
	var filterDoctorID *int

	if role == "patient" {
		filterUserID = &userID
	} else {
		if pidStr := r.URL.Query().Get("patient_id"); pidStr != "" {
			if pid, err := strconv.Atoi(pidStr); err == nil {
				filterPatientID = &pid
			}
		}
		if didStr := r.URL.Query().Get("doctor_id"); didStr != "" {
			if did, err := strconv.Atoi(didStr); err == nil {
				filterDoctorID = &did
			}
		}
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	summaries, err := h.repo.GetPrescriptions(r.Context(), filterUserID, filterPatientID, filterDoctorID, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve prescriptions")
		return
	}

	utils.WriteJSON(w, http.StatusOK, summaries)
}
