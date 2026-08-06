package models

import "time"

// PrescriptionItemInput represents a single line item when creating a prescription.
type PrescriptionItemInput struct {
	MedicineID   int    `json:"medicine_id" validate:"required"`
	Dosage       string `json:"dosage" validate:"required"`
	Quantity     int    `json:"quantity" validate:"required,min=1"`
	DurationDays int    `json:"duration_days" validate:"required,min=1"`
}

// CreatePrescriptionRequest is the payload for POST /prescriptions.
type CreatePrescriptionRequest struct {
	RecordID      int                     `json:"record_id" validate:"required"`
	AppointmentID *int                    `json:"appointment_id,omitempty"`
	Instructions  string                  `json:"instructions"`
	Items         []PrescriptionItemInput `json:"items" validate:"required,min=1"`
}

// PrescriptionDetailItem represents a single line item when reading a prescription.
type PrescriptionDetailItem struct {
	PrescriptionItemID int     `json:"prescription_item_id"`
	MedicineName       string  `json:"medicine_name"`
	MedicineInfoLink   *string `json:"medicine_info_link"`
	Dosage             string  `json:"dosage"`
	Quantity           int     `json:"quantity"`
	DurationDays       int     `json:"duration_days"`
}

// PrescriptionDetail represents the fully grouped prescription with its items.
type PrescriptionDetail struct {
	PrescriptionID   int                      `json:"prescription_id"`
	AppointmentID    *int                     `json:"appointment_id"`
	PrescriptionDate time.Time                `json:"prescription_date"`
	Instructions     string                   `json:"instructions"`
	DoctorFirstName  string                   `json:"doctor_first_name"`
	DoctorLastName   string                   `json:"doctor_last_name"`
	PatientID        int                      `json:"patient_id"`
	PatientFirstName string                   `json:"patient_first_name"`
	PatientLastName  string                   `json:"patient_last_name"`
	RecordID         int                      `json:"record_id"`
	RecordDate       time.Time                `json:"record_date"`
	Diagnosis        string                   `json:"diagnosis"`
	Treatment        string                   `json:"treatment"`
	Items            []PrescriptionDetailItem `json:"items"`
}

// PrescriptionSummary represents a lightweight view for list endpoints.
type PrescriptionSummary struct {
	PrescriptionID   int       `json:"prescription_id"`
	AppointmentID    *int      `json:"appointment_id"`
	PrescriptionDate time.Time `json:"prescription_date"`
	DoctorFirstName  string    `json:"doctor_first_name"`
	DoctorLastName   string    `json:"doctor_last_name"`
	PatientID        int       `json:"patient_id"`
	PatientFirstName string    `json:"patient_first_name"`
	PatientLastName  string    `json:"patient_last_name"`
	RecordID         int       `json:"record_id"`
	Diagnosis        string    `json:"diagnosis"`
}
