package models

import (
	"time"

	"github.com/google/uuid"
)

// Doctor represents a doctor in the system.
// It contains joined data from Users, Employees, Doctors, and Departments tables.
type Doctor struct {
	DoctorID        int       `json:"doctor_id"`
	EmployeeID      int       `json:"-"`
	UserID          int       `json:"-"`
	PublicID        uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	Role            string    `json:"role"`
	IsActive        bool      `json:"is_active"`
	DepartmentID    *int      `json:"department_id,omitempty"`
	DepartmentName  *string   `json:"department_name,omitempty"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	Phone           *string   `json:"phone,omitempty"`
	HireDate        time.Time `json:"hire_date"`
	Specialization  *string   `json:"specialization,omitempty"`
	LicenseNumber   string    `json:"license_number"`
	ConsultationFee float64   `json:"consultation_fee"`
}

type DoctorSchedule struct {
	ScheduleID  int       `json:"schedule_id"`
	DoctorID    int       `json:"doctor_id"`
	DayOfWeek   int       `json:"day_of_week"` // 0-6, 0 is Sunday
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	MaxPatients int       `json:"max_patients"`
}

type DoctorLeave struct {
	LeaveID   int       `json:"leave_id"`
	DoctorID  int       `json:"doctor_id"`
	LeaveDate time.Time `json:"leave_date"`
}
