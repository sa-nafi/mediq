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

type EmployeeHandler struct {
	repo *repository.EmployeeRepository
}

func NewEmployeeHandler(repo *repository.EmployeeRepository) *EmployeeHandler {
	return &EmployeeHandler{repo: repo}
}

type CreateStaffRequest struct {
	Email        string  `json:"email"`
	Password     string  `json:"password"`
	Role         string  `json:"role"`
	DepartmentID *int    `json:"department_id"`
	FirstName    string  `json:"first_name"`
	LastName     string  `json:"last_name"`
	Phone        *string `json:"phone"`
	HireDate     string  `json:"hire_date"`
}

func (h *EmployeeHandler) CreateStaffHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateStaffRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB limit
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.Role == "" || req.FirstName == "" || req.LastName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
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

	params := repository.CreateStaffParams{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         req.Role,
		DepartmentID: req.DepartmentID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		HireDate:     parsedHireDate,
	}

	if err := h.repo.CreateStaff(r.Context(), params); err != nil {
		if errors.Is(err, utils.ErrConflict) {
			utils.WriteError(w, http.StatusConflict, "Employee with this email already exists")
			return
		}
		if errors.Is(err, utils.ErrInvalidReference) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid department ID provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to create staff")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Staff created successfully"})
}

func (h *EmployeeHandler) GetEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	page, limit, offset := utils.ParsePaginationParams(r)
	roleFilter := r.URL.Query().Get("role")

	employees, totalCount, err := h.repo.GetAllEmployees(r.Context(), roleFilter, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve employees")
		return
	}

	utils.WritePaginatedJSON(w, http.StatusOK, employees, totalCount, page, limit)
}

func (h *EmployeeHandler) GetEmployeeByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid employee ID")
		return
	}

	employee, err := h.repo.GetEmployeeByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Employee not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, employee)
}

type UpdateEmployeeRequest struct {
	DepartmentID *int    `json:"department_id"`
	FirstName    string  `json:"first_name"`
	LastName     string  `json:"last_name"`
	Phone        *string `json:"phone"`
}

func (h *EmployeeHandler) UpdateEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid employee ID")
		return
	}

	var req UpdateEmployeeRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	params := repository.UpdateEmployeeParams{
		DepartmentID: req.DepartmentID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
	}

	if err := h.repo.UpdateEmployee(r.Context(), id, params); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Employee not found")
			return
		}
		if errors.Is(err, utils.ErrInvalidReference) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid department ID provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to update employee")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Employee updated successfully"})
}

func (h *EmployeeHandler) DeleteEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid employee ID")
		return
	}

	if err := h.repo.DeactivateUserByEmployeeID(r.Context(), id); err != nil {
		if errors.Is(err, utils.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "Employee not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to delete employee")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Employee deactivated successfully"})
}
