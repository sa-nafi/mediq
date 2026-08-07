package models

import "time"

// Patient represents a patient profile in the system.
// It maps to the "patients" database table.
type Patient struct {
	ID          int       `json:"id"`
	UserID      int       `json:"-"` // Internal FK to users table
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth time.Time `json:"date_of_birth"`
	Gender      *string   `json:"gender,omitempty"`
	BloodType   *string   `json:"blood_type,omitempty"`
	Phone       *string   `json:"phone,omitempty"`
	Address     *string   `json:"address,omitempty"`
	User        *User     `json:"user,omitempty"`
}
