package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"

	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type MedicineHandler struct {
	repo *repository.MedicineRepository
}

func NewMedicineHandler(repo *repository.MedicineRepository) *MedicineHandler {
	return &MedicineHandler{repo: repo}
}

type MedicineRequest struct {
	MedicineName string  `json:"medicine_name"`
	Category     *string `json:"category"`
	InfoLink     *string `json:"info_link"`
}

func (h *MedicineHandler) CreateMedicineHandler(w http.ResponseWriter, r *http.Request) {
	var req MedicineRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.MedicineName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Medicine name is required")
		return
	}

	if req.InfoLink != nil && *req.InfoLink != "" {
		if len(*req.InfoLink) > 255 {
			utils.WriteError(w, http.StatusBadRequest, "info_link must be 255 characters or fewer")
			return
		}
		u, err := url.ParseRequestURI(*req.InfoLink)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
			utils.WriteError(w, http.StatusBadRequest, "info_link must be a valid HTTP/HTTPS URL")
			return
		}
	}

	if err := h.repo.CreateMedicine(r.Context(), req.MedicineName, req.Category, req.InfoLink); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create medicine")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Medicine created successfully"})
}

func (h *MedicineHandler) GetMedicinesHandler(w http.ResponseWriter, r *http.Request) {
	page, limit, offset := utils.ParsePaginationParams(r)
	searchName := r.URL.Query().Get("search")
	categoryFilter := r.URL.Query().Get("category")

	medicines, totalCount, err := h.repo.GetAllMedicines(r.Context(), searchName, categoryFilter, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve medicines")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, medicines, totalCount, page, limit)
}

func (h *MedicineHandler) GetMedicineByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid medicine ID")
		return
	}

	medicine, err := h.repo.GetMedicineByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Medicine not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, medicine)
}

func (h *MedicineHandler) UpdateMedicineHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid medicine ID")
		return
	}

	var req MedicineRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.MedicineName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Medicine name is required")
		return
	}

	if req.InfoLink != nil && *req.InfoLink != "" {
		if len(*req.InfoLink) > 255 {
			utils.WriteError(w, http.StatusBadRequest, "info_link must be 255 characters or fewer")
			return
		}
		u, err := url.ParseRequestURI(*req.InfoLink)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
			utils.WriteError(w, http.StatusBadRequest, "info_link must be a valid HTTP/HTTPS URL")
			return
		}
	}

	if err := h.repo.UpdateMedicine(r.Context(), id, req.MedicineName, req.Category, req.InfoLink); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Medicine not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update medicine")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Medicine updated successfully"})
}

func (h *MedicineHandler) DeleteMedicineHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid medicine ID")
		return
	}

	if err := h.repo.DeleteMedicine(r.Context(), id); err != nil {
		if errors.Is(err, utils.ErrInUse) {
			utils.WriteError(w, http.StatusConflict, "Cannot delete medicine because it is currently prescribed to a patient")
			return
		}
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Medicine not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to delete medicine")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Medicine deleted successfully"})
}
