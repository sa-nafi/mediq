package models

import "time"

type MedicalTest struct {
	TestID           int        `json:"test_id"`
	TestName         string     `json:"test_name"`
	TestDetails      *string    `json:"test_details"`
	Status           string     `json:"status"`
	Result           *string    `json:"result"`
	OrderedDate      time.Time  `json:"ordered_date"`
	CompletedDate    *time.Time `json:"completed_date"`
	PatientID        int        `json:"patient_id"`
	PatientFirstName string     `json:"patient_first_name"`
	PatientLastName  string     `json:"patient_last_name"`
	DoctorFirstName  string     `json:"doctor_first_name"`
	DoctorLastName   string     `json:"doctor_last_name"`
	LabTechFirstName *string    `json:"lab_tech_first_name"`
	LabTechLastName  *string    `json:"lab_tech_last_name"`
}

type MedicalTestSummary struct {
	TestID           int       `json:"test_id"`
	PatientID        int       `json:"patient_id"`
	TestName         string    `json:"test_name"`
	Status           string    `json:"status"`
	OrderedDate      time.Time `json:"ordered_date"`
	PatientFirstName string    `json:"patient_first_name"`
	PatientLastName  string    `json:"patient_last_name"`
	DoctorFirstName  *string   `json:"doctor_first_name"`
	DoctorLastName   *string   `json:"doctor_last_name"`
}

type MedicalTestOrderRequest struct {
	PatientID     int     `json:"patient_id"`
	AppointmentID *int    `json:"appointment_id"`
	TestName      string  `json:"test_name"`
	TestDetails   *string `json:"test_details"`
}

type MedicalTestResultRequest struct {
	Result string `json:"result"`
	Status string `json:"status"`
}
