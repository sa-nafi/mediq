package models

import (
	"time"

	"github.com/google/uuid"
)

// Employee represents an employee (e.g. lab_tech, receptionist, admin).
// It contains joined data from Users, Employees, and Departments tables.
type Employee struct {
	EmployeeID     int       `json:"employee_id"`
	UserID         int       `json:"-"`
	PublicID       uuid.UUID `json:"id"`
	Email          string    `json:"email"`
	Role           string    `json:"role"`
	IsActive       bool      `json:"is_active"`
	DepartmentID   *int      `json:"department_id,omitempty"`
	DepartmentName *string   `json:"department_name,omitempty"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Phone          *string   `json:"phone,omitempty"`
	HireDate       time.Time `json:"hire_date"`
}
