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

type Appointment struct {
	AppointmentID   int               `json:"appointment_id"`
	PatientID       int               `json:"patient_id"`
	DoctorID        int               `json:"doctor_id"`
	AppointmentDate time.Time         `json:"appointment_date"`
	SerialNumber    int               `json:"serial_number"`
	Status          AppointmentStatus `json:"status"`
	Reason          string            `json:"reason,omitempty"`
	Notes           string            `json:"notes,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
}
