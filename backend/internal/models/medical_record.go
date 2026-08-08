package models

import "time"

type MedicalRecord struct {
	RecordID      int       `json:"record_id"`
	PatientID     int       `json:"patient_id"`
	DoctorID      int       `json:"doctor_id"`
	AppointmentID *int      `json:"appointment_id"`
	RecordDate    time.Time `json:"record_date"`
	Diagnosis     *string   `json:"diagnosis"`
	Treatment     *string   `json:"treatment"`
	Notes         *string   `json:"notes"`

	// Joined relations
	PatientFirstName string  `json:"patient_first_name,omitempty"`
	PatientLastName  string  `json:"patient_last_name,omitempty"`
	Doctor           *Doctor `json:"doctor,omitempty"`
}
