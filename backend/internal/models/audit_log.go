package models

import (
	"encoding/json"
	"time"
)

type AuditLogSummary struct {
	AuditID   int64      `json:"audit_id"`
	TableName string     `json:"table_name"`
	RecordID  int        `json:"record_id"`
	Action    string     `json:"action"`
	ChangedBy *int       `json:"changed_by"`
	ChangedAt time.Time  `json:"changed_at"`
}

type AuditLogDetail struct {
	AuditLogSummary
	OldData json.RawMessage `json:"old_data"`
	NewData json.RawMessage `json:"new_data"`
}
