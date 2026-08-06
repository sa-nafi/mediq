package repository

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type AuditRepository struct{}

func NewAuditRepository() *AuditRepository {
	return &AuditRepository{}
}

func encodeCursor(t time.Time, id int64) string {
	s := fmt.Sprintf("%s|%d", t.Format(time.RFC3339Nano), id)
	return base64.RawURLEncoding.EncodeToString([]byte(s))
}

func decodeCursor(c string) (time.Time, int64, error) {
	b, err := base64.RawURLEncoding.DecodeString(c)
	if err != nil {
		return time.Time{}, 0, err
	}
	parts := strings.Split(string(b), "|")
	if len(parts) != 2 {
		return time.Time{}, 0, errors.New("invalid cursor format")
	}
	t, err := time.Parse(time.RFC3339Nano, parts[0])
	if err != nil {
		return time.Time{}, 0, err
	}
	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return time.Time{}, 0, err
	}
	return t, id, nil
}

func (r *AuditRepository) GetAuditLogs(ctx context.Context, tableFilter, actionFilter, userIdFilter string, cursor string, limit int) ([]models.AuditLogSummary, string, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, "", errors.New("transaction not found in context")
	}

	var conditions []string
	var args []interface{}

	if tableFilter != "" {
		args = append(args, tableFilter)
		conditions = append(conditions, fmt.Sprintf("table_name = $%d", len(args)))
	}

	if actionFilter != "" {
		args = append(args, actionFilter)
		conditions = append(conditions, fmt.Sprintf("action = $%d", len(args)))
	}

	if userIdFilter != "" {
		if uid, err := strconv.Atoi(userIdFilter); err == nil {
			args = append(args, uid)
			conditions = append(conditions, fmt.Sprintf("changed_by = $%d", len(args)))
		}
	}

	if cursor != "" {
		t, id, err := decodeCursor(cursor)
		if err != nil {
			return nil, "", utils.ErrInvalidCursor
		}
		args = append(args, t, id)
		conditions = append(conditions, fmt.Sprintf("(changed_at, audit_id) < ($%d, $%d)", len(args)-1, len(args)))
	}

	query := `
		SELECT 
			audit_id, table_name, record_id, action, changed_by, changed_at
		FROM Audit_Log
	`

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	args = append(args, limit+1)
	query += fmt.Sprintf(" ORDER BY changed_at DESC, audit_id DESC LIMIT $%d", len(args))

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, "", fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	logs := make([]models.AuditLogSummary, 0)
	for rows.Next() {
		var l models.AuditLogSummary
		err := rows.Scan(&l.AuditID, &l.TableName, &l.RecordID, &l.Action, &l.ChangedBy, &l.ChangedAt)
		if err != nil {
			return nil, "", fmt.Errorf("failed to scan row: %w", err)
		}
		logs = append(logs, l)
	}

	nextCursor := ""
	if len(logs) > limit {
		lastItem := logs[limit-1]
		nextCursor = encodeCursor(lastItem.ChangedAt, lastItem.AuditID)
		logs = logs[:limit]
	}

	return logs, nextCursor, rows.Err()
}

func (r *AuditRepository) GetAuditLogByID(ctx context.Context, id int64) (*models.AuditLogDetail, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("transaction not found in context")
	}

	var l models.AuditLogDetail
	err := tx.QueryRow(ctx, `
		SELECT audit_id, table_name, record_id, action, changed_by, changed_at, old_data, new_data
		FROM Audit_Log
		WHERE audit_id = $1
	`, id).Scan(
		&l.AuditID, &l.TableName, &l.RecordID, &l.Action, &l.ChangedBy, &l.ChangedAt,
		&l.OldData, &l.NewData,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get audit log: %w", err)
	}
	return &l, nil
}
