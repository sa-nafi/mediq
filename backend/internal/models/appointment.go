package models

import (
	"time"
)

type AppointmentStatus string

const (
	StatusScheduled AppointmentStatus = "scheduled"
	StatusCompleted AppointmentStatus = "completed"
	StatusCancelled AppointmentStatus = "cancelled"
	StatusNoShow    AppointmentStatus = "no_show"
)

type AppointmentType string

const (
	TypeNew      AppointmentType = "new"
	TypeFollowUp AppointmentType = "follow-up"
	TypeReport   AppointmentType = "report"
)

type Appointment struct {
	AppointmentID   int               `json:"appointment_id"`
	PatientID       int               `json:"patient_id"`
	DoctorID        int               `json:"doctor_id"`
	AppointmentDate time.Time         `json:"appointment_date"`
	SerialNumber    int               `json:"serial_number"`
	Status          AppointmentStatus `json:"status"`
	Type            AppointmentType   `json:"type"`
	Notes           string            `json:"notes,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`

	// Joined relations
	Doctor  *Doctor  `json:"doctor,omitempty"`
	Patient *Patient `json:"patient,omitempty"`
}
