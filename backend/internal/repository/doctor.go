package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type DoctorRepository struct{}

func NewDoctorRepository() *DoctorRepository {
	return &DoctorRepository{}
}

type CreateDoctorParams struct {
	Email           string
	PasswordHash    string
	DepartmentID    *int
	FirstName       string
	LastName        string
	Phone           *string
	HireDate        time.Time
	Specialization  *string
	LicenseNumber   string
	ConsultationFee float64
}

func (r *DoctorRepository) CreateDoctor(ctx context.Context, p CreateDoctorParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	var userID int
	err := tx.QueryRow(ctx, `
		INSERT INTO Users (email, password_hash, role)
		VALUES ($1, $2, 'doctor')
		RETURNING user_id
	`, p.Email, p.PasswordHash).Scan(&userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to insert user: %w", err)
	}

	var employeeID int
	err = tx.QueryRow(ctx, `
		INSERT INTO Employees (user_id, department_id, first_name, last_name, phone, hire_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING employee_id
	`, userID, p.DepartmentID, p.FirstName, p.LastName, p.Phone, p.HireDate).Scan(&employeeID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.ForeignKeyViolation {
			return utils.ErrInvalidReference
		}
		return fmt.Errorf("failed to insert employee: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO Doctors (employee_id, specialization, license_number, consultation_fee)
		VALUES ($1, $2, $3, $4)
	`, employeeID, p.Specialization, p.LicenseNumber, p.ConsultationFee)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to insert doctor: %w", err)
	}

	return nil
}

func (r *DoctorRepository) GetAllDoctors(ctx context.Context, limit, offset int) ([]models.Doctor, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("transaction not found in context")
	}

	rows, err := tx.Query(ctx, `
		SELECT 
			COUNT(*) OVER() as total_count,
			doc.doctor_id, e.employee_id, u.user_id, u.public_id, u.email, u.role, u.is_active,
			e.department_id, d.department_name, e.first_name, e.last_name, e.phone, e.hire_date,
			doc.specialization, doc.license_number, doc.consultation_fee
		FROM Doctors doc
		JOIN Employees e ON doc.employee_id = e.employee_id
		JOIN Users u ON e.user_id = u.user_id
		LEFT JOIN Departments d ON e.department_id = d.department_id
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	doctors := make([]models.Doctor, 0)
	var totalCount int
	for rows.Next() {
		var d models.Doctor
		err := rows.Scan(
			&totalCount,
			&d.DoctorID, &d.EmployeeID, &d.UserID, &d.PublicID, &d.Email, &d.Role, &d.IsActive,
			&d.DepartmentID, &d.DepartmentName, &d.FirstName, &d.LastName, &d.Phone, &d.HireDate,
			&d.Specialization, &d.LicenseNumber, &d.ConsultationFee,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %w", err)
		}
		doctors = append(doctors, d)
	}
	return doctors, totalCount, rows.Err()
}

func (r *DoctorRepository) GetDoctorByID(ctx context.Context, doctorID int) (*models.Doctor, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var d models.Doctor
	err := tx.QueryRow(ctx, `
		SELECT 
			doc.doctor_id, e.employee_id, u.user_id, u.public_id, u.email, u.role, u.is_active,
			e.department_id, d.department_name, e.first_name, e.last_name, e.phone, e.hire_date,
			doc.specialization, doc.license_number, doc.consultation_fee
		FROM Doctors doc
		JOIN Employees e ON doc.employee_id = e.employee_id
		JOIN Users u ON e.user_id = u.user_id
		LEFT JOIN Departments d ON e.department_id = d.department_id
		WHERE doc.doctor_id = $1
	`, doctorID).Scan(
		&d.DoctorID, &d.EmployeeID, &d.UserID, &d.PublicID, &d.Email, &d.Role, &d.IsActive,
		&d.DepartmentID, &d.DepartmentName, &d.FirstName, &d.LastName, &d.Phone, &d.HireDate,
		&d.Specialization, &d.LicenseNumber, &d.ConsultationFee,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get doctor: %w", err)
	}
	return &d, nil
}

type UpdateDoctorParams struct {
	DepartmentID    *int
	FirstName       string
	LastName        string
	Phone           *string
	Specialization  *string
	ConsultationFee float64
}

func (r *DoctorRepository) UpdateDoctor(ctx context.Context, doctorID int, p UpdateDoctorParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Employees 
		SET department_id = $1, first_name = $2, last_name = $3, phone = $4
		WHERE employee_id = (SELECT employee_id FROM Doctors WHERE doctor_id = $5)
	`, p.DepartmentID, p.FirstName, p.LastName, p.Phone, doctorID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.ForeignKeyViolation {
			return utils.ErrInvalidReference
		}
		return fmt.Errorf("failed to update employee details for doctor: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}

	res, err = tx.Exec(ctx, `
		UPDATE Doctors
		SET specialization = $1, consultation_fee = $2
		WHERE doctor_id = $3
	`, p.Specialization, p.ConsultationFee, doctorID)
	if err != nil {
		return fmt.Errorf("failed to update doctor details: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

func (r *DoctorRepository) DeactivateUserByDoctorID(ctx context.Context, doctorID int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Users 
		SET is_active = false 
		WHERE user_id = (
			SELECT e.user_id 
			FROM Employees e 
			JOIN Doctors d ON e.employee_id = d.employee_id 
			WHERE d.doctor_id = $1
		)
	`, doctorID)
	if err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

func (r *DoctorRepository) GetDoctorSchedules(ctx context.Context, doctorID int) ([]models.DoctorSchedule, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	rows, err := tx.Query(ctx, `
		SELECT schedule_id, doctor_id, day_of_week, start_time, end_time, max_patients
		FROM Doctor_Schedules
		WHERE doctor_id = $1
		ORDER BY day_of_week
	`, doctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to query schedules: %w", err)
	}
	defer rows.Close()

	var schedules []models.DoctorSchedule
	for rows.Next() {
		var s models.DoctorSchedule
		if err := rows.Scan(&s.ScheduleID, &s.DoctorID, &s.DayOfWeek, &s.StartTime, &s.EndTime, &s.MaxPatients); err != nil {
			return nil, fmt.Errorf("failed to scan schedule: %w", err)
		}
		schedules = append(schedules, s)
	}
	return schedules, rows.Err()
}

type UpdateScheduleParams struct {
	DayOfWeek   int
	StartTime   time.Time
	EndTime     time.Time
	MaxPatients int
}

func (r *DoctorRepository) UpdateDoctorSchedules(ctx context.Context, doctorID int, schedules []UpdateScheduleParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	// Delete existing schedules
	if _, err := tx.Exec(ctx, "DELETE FROM Doctor_Schedules WHERE doctor_id = $1", doctorID); err != nil {
		return fmt.Errorf("failed to delete existing schedules: %w", err)
	}

	// Insert new schedules
	for _, s := range schedules {
		if _, err := tx.Exec(ctx, `
			INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
			VALUES ($1, $2, $3, $4, $5)
		`, doctorID, s.DayOfWeek, s.StartTime.Format("15:04:05"), s.EndTime.Format("15:04:05"), s.MaxPatients); err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
				return utils.ErrConflict
			}
			return fmt.Errorf("failed to insert schedule: %w", err)
		}
	}

	return nil
}

func (r *DoctorRepository) GetDoctorLeaves(ctx context.Context, doctorID int) ([]models.DoctorLeave, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	rows, err := tx.Query(ctx, `
		SELECT leave_id, doctor_id, leave_date
		FROM Doctor_Leaves
		WHERE doctor_id = $1
		ORDER BY leave_date
	`, doctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to query leaves: %w", err)
	}
	defer rows.Close()

	var leaves []models.DoctorLeave
	for rows.Next() {
		var l models.DoctorLeave
		if err := rows.Scan(&l.LeaveID, &l.DoctorID, &l.LeaveDate); err != nil {
			return nil, fmt.Errorf("failed to scan leave: %w", err)
		}
		leaves = append(leaves, l)
	}
	return leaves, rows.Err()
}

func (r *DoctorRepository) CreateDoctorLeave(ctx context.Context, doctorID int, leaveDate time.Time) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO Doctor_Leaves (doctor_id, leave_date)
		VALUES ($1, $2)
	`, doctorID, leaveDate.Format("2006-01-02"))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to insert leave: %w", err)
	}
	return nil
}

func (r *DoctorRepository) DeleteDoctorLeave(ctx context.Context, doctorID int, leaveID int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, "DELETE FROM Doctor_Leaves WHERE doctor_id = $1 AND leave_id = $2", doctorID, leaveID)
	if err != nil {
		return fmt.Errorf("failed to delete leave: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}
