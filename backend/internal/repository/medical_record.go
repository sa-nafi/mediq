package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
)

type MedicalRecordRepository struct{}

func NewMedicalRecordRepository() *MedicalRecordRepository {
	return &MedicalRecordRepository{}
}

// CreateMedicalRecord inserts a new medical record.
func (r *MedicalRecordRepository) CreateMedicalRecord(ctx context.Context, doctorUserID, patientID int, appointmentID *int, diagnosis, treatment, notes *string) (int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return 0, errors.New("transaction not found in context")
	}

	// 1. Resolve doctor_id from doctorUserID
	var doctorID int
	err := tx.QueryRow(ctx, `
		SELECT d.doctor_id
		FROM Doctors d
		JOIN Employees e ON d.employee_id = e.employee_id
		WHERE e.user_id = $1
	`, doctorUserID).Scan(&doctorID)
	if err != nil {
		return 0, fmt.Errorf("failed to resolve doctor ID: %w", err)
	}

	// 2. Insert into Medical_Records
	query := `
		INSERT INTO Medical_Records (patient_id, doctor_id, appointment_id, diagnosis, treatment, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING record_id
	`
	var recordID int
	err = tx.QueryRow(ctx, query, patientID, doctorID, appointmentID, diagnosis, treatment, notes).Scan(&recordID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert medical record: %w", err)
	}

	return recordID, nil
}

// GetMedicalRecords retrieves medical records with optional filtering based on role.
func (r *MedicalRecordRepository) GetMedicalRecords(ctx context.Context, role string, userID int, filterPatientID *int) ([]models.MedicalRecord, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT mr.record_id, mr.patient_id, mr.doctor_id, mr.appointment_id, mr.record_date, mr.diagnosis, mr.treatment, mr.notes,
		       e.first_name AS doc_first, e.last_name AS doc_last, e.phone AS doc_phone, d.specialization
		FROM Medical_Records mr
		JOIN Doctors d ON mr.doctor_id = d.doctor_id
		JOIN Employees e ON d.employee_id = e.employee_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if role == "patient" {
		query += fmt.Sprintf(" AND mr.patient_id = (SELECT patient_id FROM Patients WHERE user_id = $%d)", argIndex)
		args = append(args, userID)
		argIndex++
	} else if role == "doctor" {
		query += fmt.Sprintf(" AND mr.doctor_id = (SELECT doctor_id FROM Doctors JOIN Employees emp ON Doctors.employee_id = emp.employee_id WHERE emp.user_id = $%d)", argIndex)
		args = append(args, userID)
		argIndex++
	}

	if filterPatientID != nil {
		query += fmt.Sprintf(" AND mr.patient_id = $%d", argIndex)
		args = append(args, *filterPatientID)
		argIndex++
	}

	query += ` ORDER BY mr.record_date DESC`

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.MedicalRecord
	for rows.Next() {
		var r models.MedicalRecord
		var doc models.Doctor
		if err := rows.Scan(
			&r.RecordID, &r.PatientID, &r.DoctorID, &r.AppointmentID, &r.RecordDate, &r.Diagnosis, &r.Treatment, &r.Notes,
			&doc.FirstName, &doc.LastName, &doc.Phone, &doc.Specialization,
		); err != nil {
			return nil, err
		}
		r.Doctor = &doc
		records = append(records, r)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if records == nil {
		records = []models.MedicalRecord{}
	}

	return records, nil
}

// GetMedicalRecordByID retrieves a single medical record.
func (r *MedicalRecordRepository) GetMedicalRecordByID(ctx context.Context, recordID int) (*models.MedicalRecord, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT record_id, patient_id, doctor_id, appointment_id, record_date, diagnosis, treatment, notes
		FROM Medical_Records
		WHERE record_id = $1
	`

	var m models.MedicalRecord
	err := tx.QueryRow(ctx, query, recordID).Scan(
		&m.RecordID,
		&m.PatientID,
		&m.DoctorID,
		&m.AppointmentID,
		&m.RecordDate,
		&m.Diagnosis,
		&m.Treatment,
		&m.Notes,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query medical record by ID: %w", err)
	}

	return &m, nil
}

// VerifyRecordOwnership checks if the given record belongs to the patient associated with the userID.
func (r *MedicalRecordRepository) VerifyRecordOwnership(ctx context.Context, recordID, userID int) (bool, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return false, errors.New("transaction not found in context")
	}

	query := `
		SELECT EXISTS (
			SELECT 1
			FROM Medical_Records m
			JOIN Patients p ON m.patient_id = p.patient_id
			WHERE m.record_id = $1 AND p.user_id = $2
		)
	`
	var exists bool
	if err := tx.QueryRow(ctx, query, recordID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to verify ownership: %w", err)
	}

	return exists, nil
}
