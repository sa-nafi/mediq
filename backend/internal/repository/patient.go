package repository

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

// PatientRepository handles database operations for patients.
type PatientRepository struct{}

// NewPatientRepository returns a new instance of PatientRepository.
func NewPatientRepository() *PatientRepository {
	return &PatientRepository{}
}

// RegisterPatientParams holds the parameters for registering a new patient.
type RegisterPatientParams struct {
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	DateOfBirth  time.Time
	Gender       *string
	BloodType    *string
	Phone        *string
	Address      *string
}

// RegisterPatient inserts a new user (with 'patient' role) and their patient details.
func (r *PatientRepository) RegisterPatient(
	ctx context.Context,
	params RegisterPatientParams,
) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("no database transaction found in context")
	}

	// Step 1: Insert into Users table
	var userID int
	userQuery := `
		INSERT INTO Users (email, password_hash, role) 
		VALUES ($1, $2, 'patient') 
		RETURNING user_id
	`
	err := tx.QueryRow(ctx, userQuery, params.Email, params.PasswordHash).Scan(&userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return utils.ErrDuplicateEmail
		}
		return err
	}

	// Step 2: Insert into Patients table
	patientQuery := `
		INSERT INTO Patients (
			user_id, first_name, last_name, date_of_birth, gender, blood_type, phone, address
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
	`
	_, err = tx.Exec(ctx, patientQuery, userID, params.FirstName, params.LastName, params.DateOfBirth, params.Gender, params.BloodType, params.Phone, params.Address)
	if err != nil {
		return err
	}

	return nil
}

// CreateWalkInPatient creates a new guest patient without an associated User record.
func (r *PatientRepository) CreateWalkInPatient(
	ctx context.Context,
	patient *models.Patient,
) (int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return 0, errors.New("no database transaction found in context")
	}

	var patientID int
	query := `
		INSERT INTO Patients (
			first_name, last_name, date_of_birth, gender, blood_type, phone, address
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		) RETURNING patient_id
	`
	err := tx.QueryRow(ctx, query,
		patient.FirstName,
		patient.LastName,
		patient.DateOfBirth,
		patient.Gender,
		patient.BloodType,
		patient.Phone,
		patient.Address,
	).Scan(&patientID)

	if err != nil {
		return 0, err
	}

	return patientID, nil
}

// GetAllPatients retrieves a list of all patients with pagination.
// If searchQuery is provided, it filters by first_name, last_name, or phone.
func (r *PatientRepository) GetAllPatients(ctx context.Context, searchQuery string, limit, offset int) ([]models.Patient, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("no database transaction found in context")
	}

	baseQuery := ` FROM Patients`
	args := []interface{}{}

	if searchQuery != "" {
		baseQuery += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1`
		args = append(args, "%"+searchQuery+"%")
	}
	
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := tx.QueryRow(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := `SELECT patient_id, user_id, first_name, last_name, date_of_birth, gender, blood_type, phone, address ` + baseQuery
	query += ` ORDER BY patient_id DESC LIMIT $` + strconv.Itoa(len(args)+1) + ` OFFSET $` + strconv.Itoa(len(args)+2)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var patients []models.Patient
	for rows.Next() {
		var p models.Patient
		err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.FirstName,
			&p.LastName,
			&p.DateOfBirth,
			&p.Gender,
			&p.BloodType,
			&p.Phone,
			&p.Address,
		)
		if err != nil {
			return nil, 0, err
		}
		patients = append(patients, p)
	}
	
	if patients == nil {
		patients = []models.Patient{}
	}
	
	return patients, totalCount, nil
}

// GetPatientByUserID retrieves a single patient by their associated user ID.
func (r *PatientRepository) GetPatientByUserID(ctx context.Context, userID int) (*models.Patient, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	query := `
		SELECT 
			p.patient_id, p.user_id,
			p.first_name, p.last_name, p.date_of_birth, p.gender, p.blood_type,
			p.phone, p.address,
			u.email
		FROM Patients p
		JOIN Users u ON p.user_id = u.user_id
		WHERE p.user_id = $1
	`
	var p models.Patient
	var email string
	err := tx.QueryRow(ctx, query, userID).Scan(
		&p.ID,
		&p.UserID,
		&p.FirstName,
		&p.LastName,
		&p.DateOfBirth,
		&p.Gender,
		&p.BloodType,
		&p.Phone,
		&p.Address,
		&email,
	)
	if err == nil {
		p.User = &models.User{
			Email: email,
		}
	}
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, err
	}

	return &p, nil
}

// GetPatientByID retrieves a single patient by their ID.
func (r *PatientRepository) GetPatientByID(ctx context.Context, patientID int) (*models.Patient, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("no database transaction found in context")
	}

	query := `
		SELECT patient_id, user_id, first_name, last_name, date_of_birth, gender, blood_type, phone, address
		FROM Patients
		WHERE patient_id = $1
	`
	var p models.Patient
	err := tx.QueryRow(ctx, query, patientID).Scan(
		&p.ID,
		&p.UserID,
		&p.FirstName,
		&p.LastName,
		&p.DateOfBirth,
		&p.Gender,
		&p.BloodType,
		&p.Phone,
		&p.Address,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// UpdatePatientParams holds the parameters for updating a patient's details.
type UpdatePatientParams struct {
	FirstName   *string
	LastName    *string
	Phone       *string
	Address     *string
	DateOfBirth *string
	Gender      *string
	BloodType   *string
}

// UpdatePatient updates a patient's details.
func (r *PatientRepository) UpdatePatient(ctx context.Context, patientID int, params UpdatePatientParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("no database transaction found in context")
	}

	query := `
		UPDATE Patients
		SET 
			first_name = COALESCE($2, first_name),
			last_name = COALESCE($3, last_name),
			phone = COALESCE($4, phone),
			address = COALESCE($5, address),
			date_of_birth = COALESCE($6, date_of_birth),
			gender = COALESCE($7, gender),
			blood_type = COALESCE($8, blood_type)
		WHERE patient_id = $1
	`
	commandTag, err := tx.Exec(ctx, query, patientID, params.FirstName, params.LastName, params.Phone, params.Address, params.DateOfBirth, params.Gender, params.BloodType)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

// VerifyPatientOwnership checks if the given patientID belongs to the given userID.
func (r *PatientRepository) VerifyPatientOwnership(ctx context.Context, patientID int, userID int) (bool, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return false, errors.New("no database transaction found in context")
	}

	query := `SELECT EXISTS(SELECT 1 FROM Patients WHERE patient_id = $1 AND user_id = $2)`
	var exists bool
	err := tx.QueryRow(ctx, query, patientID, userID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
