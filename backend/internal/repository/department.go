package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type DepartmentRepository struct{}

func NewDepartmentRepository() *DepartmentRepository {
	return &DepartmentRepository{}
}

func (r *DepartmentRepository) CreateDepartment(ctx context.Context, name string, description *string) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO Departments (department_name, description)
		VALUES ($1, $2)
	`, name, description)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to create department: %w", err)
	}
	return nil
}

func (r *DepartmentRepository) GetAllDepartments(ctx context.Context, limit, offset int) ([]models.Department, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("transaction not found in context")
	}

	rows, err := tx.Query(ctx, `
		SELECT 
			COUNT(*) OVER() as total_count,
			department_id, department_name, description
		FROM Departments
		ORDER BY department_name
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	departments := make([]models.Department, 0)
	var totalCount int
	for rows.Next() {
		var d models.Department
		err := rows.Scan(&totalCount, &d.DepartmentID, &d.DepartmentName, &d.Description)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %w", err)
		}
		departments = append(departments, d)
	}
	return departments, totalCount, rows.Err()
}

func (r *DepartmentRepository) GetDepartmentByID(ctx context.Context, id int) (*models.Department, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var d models.Department
	err := tx.QueryRow(ctx, `
		SELECT department_id, department_name, description
		FROM Departments
		WHERE department_id = $1
	`, id).Scan(&d.DepartmentID, &d.DepartmentName, &d.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to get department: %w", err)
	}
	return &d, nil
}

func (r *DepartmentRepository) UpdateDepartment(ctx context.Context, id int, name string, description *string) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Departments
		SET department_name = $1, description = $2
		WHERE department_id = $3
	`, name, description, id)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation {
			return utils.ErrConflict
		}
		return fmt.Errorf("failed to update department: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

func (r *DepartmentRepository) DeleteDepartment(ctx context.Context, id int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		DELETE FROM Departments
		WHERE department_id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("failed to delete department: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}
