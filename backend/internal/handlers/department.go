package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type DepartmentHandler struct {
	repo *repository.DepartmentRepository
}

func NewDepartmentHandler(repo *repository.DepartmentRepository) *DepartmentHandler {
	return &DepartmentHandler{repo: repo}
}

type DepartmentRequest struct {
	DepartmentName string  `json:"department_name"`
	Description    *string `json:"description"`
}

func (h *DepartmentHandler) CreateDepartmentHandler(w http.ResponseWriter, r *http.Request) {
	var req DepartmentRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DepartmentName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Department name is required")
		return
	}

	if err := h.repo.CreateDepartment(r.Context(), req.DepartmentName, req.Description); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Department with this name already exists")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create department")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Department created successfully"})
}

func (h *DepartmentHandler) GetDepartmentsHandler(w http.ResponseWriter, r *http.Request) {
	page, limit, offset := utils.ParsePaginationParams(r)

	departments, totalCount, err := h.repo.GetAllDepartments(r.Context(), limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve departments")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, departments, totalCount, page, limit)
}

func (h *DepartmentHandler) GetDepartmentByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	department, err := h.repo.GetDepartmentByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Department not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, department)
}

func (h *DepartmentHandler) UpdateDepartmentHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	var req DepartmentRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DepartmentName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Department name is required")
		return
	}

	if err := h.repo.UpdateDepartment(r.Context(), id, req.DepartmentName, req.Description); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Department with this name already exists")
			return
		}
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Department not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update department")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Department updated successfully"})
}

func (h *DepartmentHandler) DeleteDepartmentHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	if err := h.repo.DeleteDepartment(r.Context(), id); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Department not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to delete department")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Department deleted successfully"})
}
