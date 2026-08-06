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
		SELECT record_id, patient_id, doctor_id, appointment_id, record_date, diagnosis, treatment, notes
		FROM Medical_Records
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if role == "patient" {
		// Resolve patient_id from userID
		var patientID int
		err := tx.QueryRow(ctx, `SELECT patient_id FROM Patients WHERE user_id = $1`, userID).Scan(&patientID)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve patient ID: %w", err)
		}
		query += fmt.Sprintf(" AND patient_id = $%d", argIndex)
		args = append(args, patientID)
		argIndex++
	} else if filterPatientID != nil {
		// For doctors and admins, allow filtering by patient
		query += fmt.Sprintf(" AND patient_id = $%d", argIndex)
		args = append(args, *filterPatientID)
		argIndex++
	}

	query += " ORDER BY record_date DESC, record_id DESC"

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query medical records: %w", err)
	}
	defer rows.Close()

	var records []models.MedicalRecord
	for rows.Next() {
		var m models.MedicalRecord
		if err := rows.Scan(
			&m.RecordID,
			&m.PatientID,
			&m.DoctorID,
			&m.AppointmentID,
			&m.RecordDate,
			&m.Diagnosis,
			&m.Treatment,
			&m.Notes,
		); err != nil {
			return nil, fmt.Errorf("failed to scan medical record: %w", err)
		}
		records = append(records, m)
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
