package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type MedicineRepository struct{}

func NewMedicineRepository() *MedicineRepository {
	return &MedicineRepository{}
}

func (r *MedicineRepository) CreateMedicine(ctx context.Context, name string, category *string) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO Medicines (medicine_name, category)
		VALUES ($1, $2)
	`, name, category)
	if err != nil {
		return fmt.Errorf("failed to create medicine: %w", err)
	}
	return nil
}

func (r *MedicineRepository) GetAllMedicines(ctx context.Context, searchName, categoryFilter string, limit, offset int) ([]models.Medicine, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("transaction not found in context")
	}

	var conditions []string
	var args []interface{}

	if searchName != "" {
		args = append(args, "%"+searchName+"%")
		conditions = append(conditions, fmt.Sprintf("medicine_name ILIKE $%d", len(args)))
	}

	if categoryFilter != "" {
		args = append(args, categoryFilter)
		conditions = append(conditions, fmt.Sprintf("category = $%d", len(args)))
	}

	query := `
		SELECT 
			COUNT(*) OVER() as total_count,
			medicine_id, medicine_name, category
		FROM Medicines
	`

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	args = append(args, limit, offset)
	query += fmt.Sprintf(" ORDER BY medicine_name LIMIT $%d OFFSET $%d", len(args)-1, len(args))

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	medicines := make([]models.Medicine, 0)
	var totalCount int
	for rows.Next() {
		var m models.Medicine
		err := rows.Scan(&totalCount, &m.MedicineID, &m.MedicineName, &m.Category)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %w", err)
		}
		medicines = append(medicines, m)
	}
	return medicines, totalCount, rows.Err()
}

func (r *MedicineRepository) GetMedicineByID(ctx context.Context, id int) (*models.Medicine, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var m models.Medicine
	err := tx.QueryRow(ctx, `
		SELECT medicine_id, medicine_name, category
		FROM Medicines
		WHERE medicine_id = $1
	`, id).Scan(&m.MedicineID, &m.MedicineName, &m.Category)
	if err != nil {
		return nil, fmt.Errorf("failed to get medicine: %w", err)
	}
	return &m, nil
}

func (r *MedicineRepository) UpdateMedicine(ctx context.Context, id int, name string, category *string) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		UPDATE Medicines
		SET medicine_name = $1, category = $2
		WHERE medicine_id = $3
	`, name, category, id)
	if err != nil {
		return fmt.Errorf("failed to update medicine: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

func (r *MedicineRepository) DeleteMedicine(ctx context.Context, id int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("transaction not found in context")
	}

	res, err := tx.Exec(ctx, `
		DELETE FROM Medicines
		WHERE medicine_id = $1
	`, id)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.ForeignKeyViolation {
			return utils.ErrInUse
		}
		return fmt.Errorf("failed to delete medicine: %w", err)
	}
	if res.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}
