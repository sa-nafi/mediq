package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type MedicalTestRepository struct{}



func NewMedicalTestRepository() *MedicalTestRepository {
	return &MedicalTestRepository{}
}

// OrderTest inserts a new medical test order.
func (r *MedicalTestRepository) OrderTest(ctx context.Context, doctorUserID, patientID int, appointmentID *int, testName string, testDetails *string) (int, error) {
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
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, utils.ErrNotFound
		}
		return 0, fmt.Errorf("failed to resolve doctor ID: %w", err)
	}

	// 2. Validate appointment belongs to patient and doctor
	if appointmentID != nil {
		var valid bool
		err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM Appointments WHERE appointment_id = $1 AND patient_id = $2 AND doctor_id = $3)`, *appointmentID, patientID, doctorID).Scan(&valid)
		if err != nil {
			return 0, fmt.Errorf("failed to validate appointment: %w", err)
		}
		if !valid {
			return 0, utils.ErrInvalidReference
		}
	}

	// 3. Insert into Medical_Tests
	query := `
		INSERT INTO Medical_Tests (patient_id, doctor_id, appointment_id, test_name, test_details, status)
		VALUES ($1, $2, $3, $4, $5, 'ordered')
		RETURNING test_id
	`
	var testID int
	err = tx.QueryRow(ctx, query, patientID, doctorID, appointmentID, testName, testDetails).Scan(&testID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert medical test: %w", err)
	}

	return testID, nil
}

// GetTests fetches a lightweight summary list of tests, supporting status filters.
func (r *MedicalTestRepository) GetTests(ctx context.Context, status string, offset, limit int) ([]models.MedicalTestSummary, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT t.test_id, t.patient_id, t.test_name, t.status, t.ordered_date, p.first_name, p.last_name
		FROM Medical_Tests t
		JOIN Patients p ON t.patient_id = p.patient_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += fmt.Sprintf(" AND t.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	query += fmt.Sprintf(" ORDER BY t.ordered_date DESC, t.test_id DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tests: %w", err)
	}
	defer rows.Close()

	var tests []models.MedicalTestSummary
	for rows.Next() {
		var t models.MedicalTestSummary
		if err := rows.Scan(
			&t.TestID,
			&t.PatientID,
			&t.TestName,
			&t.Status,
			&t.OrderedDate,
			&t.PatientFirstName,
			&t.PatientLastName,
		); err != nil {
			return nil, fmt.Errorf("failed to scan test summary: %w", err)
		}
		tests = append(tests, t)
	}

	if tests == nil {
		tests = []models.MedicalTestSummary{}
	}

	return tests, nil
}

// GetTestByID retrieves a single medical test from the comprehensive view.
func (r *MedicalTestRepository) GetTestByID(ctx context.Context, testID int) (*models.MedicalTest, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT test_id, test_name, test_details, status, result, ordered_date, completed_date,
		       patient_id, patient_first_name, patient_last_name, 
		       ordering_doctor_first_name, ordering_doctor_last_name, 
		       performed_by_first_name, performed_by_last_name
		FROM test_detail_view
		WHERE test_id = $1
	`

	var t models.MedicalTest
	err := tx.QueryRow(ctx, query, testID).Scan(
		&t.TestID,
		&t.TestName,
		&t.TestDetails,
		&t.Status,
		&t.Result,
		&t.OrderedDate,
		&t.CompletedDate,
		&t.PatientID,
		&t.PatientFirstName,
		&t.PatientLastName,
		&t.DoctorFirstName,
		&t.DoctorLastName,
		&t.LabTechFirstName,
		&t.LabTechLastName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, fmt.Errorf("failed to query test detail by ID: %w", err)
	}

	return &t, nil
}

// UpdateTest allows lab techs to complete or update a test result via raw SQL.
func (r *MedicalTestRepository) UpdateTest(ctx context.Context, testID int, result string, labTechUserID int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	// 1. Resolve employee_id for the lab tech
	var employeeID int
	err := tx.QueryRow(ctx, `SELECT employee_id FROM Employees WHERE user_id = $1`, labTechUserID).Scan(&employeeID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("lab tech not found: %w", utils.ErrNotFound)
		}
		return fmt.Errorf("failed to resolve lab tech employee ID: %w", err)
	}

	// 2. Perform raw update
	query := `
		UPDATE Medical_Tests 
		SET result = $1, 
		    status = 'completed', 
		    completed_date = CURRENT_DATE, 
		    performed_by = $2 
		WHERE test_id = $3 AND status != 'cancelled'
	`
	cmdTag, err := tx.Exec(ctx, query, result, employeeID, testID)
	if err != nil {
		return fmt.Errorf("failed to update test: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return utils.ErrNotFound
	}

	return nil
}

// VerifyTestOwnership checks if the given test belongs to the patient associated with the userID.
func (r *MedicalTestRepository) VerifyTestOwnership(ctx context.Context, testID, userID int) (bool, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return false, errors.New("transaction not found in context")
	}

	query := `
		SELECT EXISTS (
			SELECT 1
			FROM Medical_Tests t
			JOIN Patients p ON t.patient_id = p.patient_id
			WHERE t.test_id = $1 AND p.user_id = $2
		)
	`
	var exists bool
	if err := tx.QueryRow(ctx, query, testID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to verify ownership: %w", err)
	}

	return exists, nil
}
