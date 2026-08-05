package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
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
