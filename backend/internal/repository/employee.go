package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type EmployeeRepository struct{}

func NewEmployeeRepository() *EmployeeRepository {
	return &EmployeeRepository{}
}

type CreateStaffParams struct {
	Email        string
	PasswordHash string
	Role         string
	DepartmentID *int
	FirstName    string
	LastName     string
	Phone        *string
	HireDate     time.Time
}

func (r *EmployeeRepository) CreateStaff(ctx context.Context, p CreateStaffParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	if p.Role != "lab_tech" && p.Role != "receptionist" {
		return fmt.Errorf("invalid staff role: %s", p.Role)
	}

	var userID int
	err := tx.QueryRow(ctx, `
		INSERT INTO Users (email, password_hash, role)
		VALUES ($1, $2, $3)
		RETURNING user_id
	`, p.Email, p.PasswordHash, p.Role).Scan(&userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to insert user: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO Employees (user_id, department_id, first_name, last_name, phone, hire_date)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, userID, p.DepartmentID, p.FirstName, p.LastName, p.Phone, p.HireDate)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.ForeignKeyViolation {
			return utils.ErrInvalidReference
		}
		return fmt.Errorf("failed to insert employee: %w", err)
	}

	return nil
}

func (r *EmployeeRepository) GetAllEmployees(ctx context.Context, roleFilter string, limit, offset int) ([]models.Employee, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("transaction not found in context")
	}

	query := `
		SELECT 
			COUNT(*) OVER() as total_count,
			e.employee_id, u.user_id, u.public_id, u.email, u.role, u.is_active,
			e.department_id, d.department_name, e.first_name, e.last_name, e.phone, e.hire_date
		FROM Employees e
		JOIN Users u ON e.user_id = u.user_id
		LEFT JOIN Departments d ON e.department_id = d.department_id
		WHERE u.role IN ('lab_tech', 'receptionist')
	`
	var args []interface{}

	if roleFilter != "" {
		query += " AND u.role = $1"
		args = append(args, roleFilter)
	}

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	employees := make([]models.Employee, 0)
	var totalCount int
	for rows.Next() {
		var emp models.Employee
		err := rows.Scan(
			&totalCount,
			&emp.EmployeeID, &emp.UserID, &emp.PublicID, &emp.Email, &emp.Role, &emp.IsActive,
			&emp.DepartmentID, &emp.DepartmentName, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.HireDate,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %w", err)
		}
		employees = append(employees, emp)
	}
	return employees, totalCount, rows.Err()
}

func (r *EmployeeRepository) GetEmployeeByID(ctx context.Context, employeeID int) (*models.Employee, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var emp models.Employee
	err := tx.QueryRow(ctx, `
		SELECT 
			e.employee_id, u.user_id, u.public_id, u.email, u.role, u.is_active,
			e.department_id, d.department_name, e.first_name, e.last_name, e.phone, e.hire_date
		FROM Employees e
		JOIN Users u ON e.user_id = u.user_id
		LEFT JOIN Departments d ON e.department_id = d.department_id
		WHERE e.employee_id = $1
	`, employeeID).Scan(
		&emp.EmployeeID, &emp.UserID, &emp.PublicID, &emp.Email, &emp.Role, &emp.IsActive,
		&emp.DepartmentID, &emp.DepartmentName, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.HireDate,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get employee: %w", err)
	}
	return &emp, nil
}

func (r *EmployeeRepository) GetEmployeeByUserID(ctx context.Context, userID int) (*models.Employee, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var emp models.Employee
	err := tx.QueryRow(ctx, `
		SELECT 
			e.employee_id, u.user_id, u.public_id, u.email, u.role, u.is_active,
			e.department_id, d.department_name, e.first_name, e.last_name, e.phone, e.hire_date
		FROM Employees e
		JOIN Users u ON e.user_id = u.user_id
		LEFT JOIN Departments d ON e.department_id = d.department_id
		WHERE u.user_id = $1
	`, userID).Scan(
		&emp.EmployeeID, &emp.UserID, &emp.PublicID, &emp.Email, &emp.Role, &emp.IsActive,
		&emp.DepartmentID, &emp.DepartmentName, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.HireDate,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get employee by user id: %w", err)
	}
	return &emp, nil
}

type UpdateEmployeeParams struct {
	DepartmentID *int
	FirstName    *string
	LastName     *string
	Phone        *string
}

func (r *EmployeeRepository) UpdateEmployee(ctx context.Context, employeeID int, p UpdateEmployeeParams) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Employees
		SET
			department_id = COALESCE($1, department_id),
			first_name = COALESCE($2, first_name),
			last_name = COALESCE($3, last_name),
			phone = COALESCE($4, phone)
		WHERE employee_id = $5
	`, p.DepartmentID, p.FirstName, p.LastName, p.Phone, employeeID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.ForeignKeyViolation {
			return utils.ErrInvalidReference
		}
		return fmt.Errorf("failed to update employee: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

func (r *EmployeeRepository) DeactivateUserByEmployeeID(ctx context.Context, employeeID int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Users 
		SET is_active = false 
		WHERE user_id = (SELECT user_id FROM Employees WHERE employee_id = $1)
	`, employeeID)
	if err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}
