package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"

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

// GetMedicalRecords retrieves medical records with optional filtering based on role, with pagination.
func (r *MedicalRecordRepository) GetMedicalRecords(ctx context.Context, role string, userID int, filterPatientID *int, consultationApptID *int, limit, offset int) ([]models.MedicalRecord, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("transaction not found in context")
	}

	baseQuery := `
		FROM Medical_Records mr
		JOIN Doctors d ON mr.doctor_id = d.doctor_id
		JOIN Employees e ON d.employee_id = e.employee_id
		JOIN Patients p ON mr.patient_id = p.patient_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	switch role {
	case "patient":
		baseQuery += fmt.Sprintf(" AND mr.patient_id = (SELECT patient_id FROM Patients WHERE user_id = $%d)", argIndex)
		args = append(args, userID)
		argIndex++
	case "doctor":
		hasConsultationAccess := false
		if consultationApptID != nil && filterPatientID != nil {
			var exists bool
			verifyQuery := `
				SELECT EXISTS(
					SELECT 1 FROM Appointments a
					JOIN Doctors d ON a.doctor_id = d.doctor_id
					JOIN Employees e ON d.employee_id = e.employee_id
					WHERE a.appointment_id = $1 AND a.patient_id = $2 AND e.user_id = $3
				)
			`
			if err := tx.QueryRow(ctx, verifyQuery, *consultationApptID, *filterPatientID, userID).Scan(&exists); err == nil && exists {
				hasConsultationAccess = true
			}
		}

		if !hasConsultationAccess {
			baseQuery += fmt.Sprintf(" AND mr.doctor_id = (SELECT doctor_id FROM Doctors JOIN Employees emp ON Doctors.employee_id = emp.employee_id WHERE emp.user_id = $%d)", argIndex)
			args = append(args, userID)
			argIndex++
		}
	}

	if filterPatientID != nil {
		baseQuery += fmt.Sprintf(" AND mr.patient_id = $%d", argIndex)
		args = append(args, *filterPatientID)
		argIndex++
	}

	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := tx.QueryRow(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT mr.record_id, mr.patient_id, mr.doctor_id, mr.appointment_id, mr.record_date, mr.diagnosis, mr.treatment, mr.notes,
		       e.first_name AS doc_first, e.last_name AS doc_last, e.phone AS doc_phone, d.specialization,
		       p.first_name AS pat_first, p.last_name AS pat_last
	` + baseQuery
	
	query += ` ORDER BY mr.record_date DESC LIMIT $` + strconv.Itoa(argIndex) + ` OFFSET $` + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []models.MedicalRecord
	for rows.Next() {
		var r models.MedicalRecord
		var doc models.Doctor
		if err := rows.Scan(
			&r.RecordID, &r.PatientID, &r.DoctorID, &r.AppointmentID, &r.RecordDate, &r.Diagnosis, &r.Treatment, &r.Notes,
			&doc.FirstName, &doc.LastName, &doc.Phone, &doc.Specialization,
			&r.PatientFirstName, &r.PatientLastName,
		); err != nil {
			return nil, 0, err
		}
		r.Doctor = &doc
		records = append(records, r)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	if records == nil {
		records = []models.MedicalRecord{}
	}

	return records, totalCount, nil
}

// GetMedicalRecordByID retrieves a single medical record.
func (r *MedicalRecordRepository) GetMedicalRecordByID(ctx context.Context, recordID int) (*models.MedicalRecord, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT mr.record_id, mr.patient_id, mr.doctor_id, mr.appointment_id, mr.record_date, mr.diagnosis, mr.treatment, mr.notes,
		       p.first_name, p.last_name,
		       e.first_name, e.last_name
		FROM Medical_Records mr
		JOIN Patients p ON mr.patient_id = p.patient_id
		JOIN Doctors d ON mr.doctor_id = d.doctor_id
		JOIN Employees e ON d.employee_id = e.employee_id
		WHERE mr.record_id = $1
	`

	var m models.MedicalRecord
	var doc models.Doctor
	err := tx.QueryRow(ctx, query, recordID).Scan(
		&m.RecordID,
		&m.PatientID,
		&m.DoctorID,
		&m.AppointmentID,
		&m.RecordDate,
		&m.Diagnosis,
		&m.Treatment,
		&m.Notes,
		&m.PatientFirstName,
		&m.PatientLastName,
		&doc.FirstName,
		&doc.LastName,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query medical record by ID: %w", err)
	}

	m.Doctor = &doc
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
