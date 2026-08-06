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

type MedicalTestHandler struct {
	repo *repository.MedicalTestRepository
}

func NewMedicalTestHandler(repo *repository.MedicalTestRepository) *MedicalTestHandler {
	return &MedicalTestHandler{repo: repo}
}

func (h *MedicalTestHandler) OrderMedicalTestHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.MedicalTestOrderRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.PatientID == 0 || req.TestName == "" {
		utils.WriteError(w, http.StatusBadRequest, "patient_id and test_name are required")
		return
	}

	testID, err := h.repo.OrderTest(
		r.Context(),
		userID,
		req.PatientID,
		req.AppointmentID,
		req.TestName,
		req.TestDetails,
	)
	if err != nil {
		if errors.Is(err, utils.ErrInvalidReference) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid appointment ID for this patient")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to order test")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"test_id": testID,
		"message": "Test ordered successfully",
	})
}

func (h *MedicalTestHandler) GetTestsHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	
	offset := 0
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	limit := 50
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	tests, err := h.repo.GetTests(r.Context(), status, offset, limit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve tests")
		return
	}

	utils.WriteJSON(w, http.StatusOK, tests)
}

func (h *MedicalTestHandler) GetTestByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	testID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid test ID")
		return
	}

	role, _ := r.Context().Value(middleware.RoleKey).(string)
	userID, _ := r.Context().Value(middleware.UserIDKey).(int)

	if role == "patient" {
		isOwner, err := h.repo.VerifyTestOwnership(r.Context(), testID, userID)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to verify ownership")
			return
		}
		if !isOwner {
			utils.WriteError(w, http.StatusForbidden, "You do not have permission to view this test")
			return
		}
	}

	test, err := h.repo.GetTestByID(r.Context(), testID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Test not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, test)
}

func (h *MedicalTestHandler) UpdateMedicalTestHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	testID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid test ID")
		return
	}

	var req models.MedicalTestResultRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Result == "" {
		utils.WriteError(w, http.StatusBadRequest, "result is required")
		return
	}

	err = h.repo.UpdateTest(r.Context(), testID, req.Result, userID)
	if err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Test not found")
		} else {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to update test")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Test updated successfully",
	})
}
