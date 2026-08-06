package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type PrescriptionRepository struct{}

func NewPrescriptionRepository() *PrescriptionRepository {
	return &PrescriptionRepository{}
}

// CreatePrescription creates a prescription and its line items by calling the stored procedure.
func (r *PrescriptionRepository) CreatePrescription(ctx context.Context, doctorUserID int, req models.CreatePrescriptionRequest) (int, error) {
	tx := db.TxFromContext(ctx)

	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		return 0, fmt.Errorf("failed to serialize items: %w", err)
	}

	var doctorID int
	err = tx.QueryRow(ctx, `
		SELECT d.doctor_id
		FROM Doctors d
		JOIN Employees e ON d.employee_id = e.employee_id
		WHERE e.user_id = $1
	`, doctorUserID).Scan(&doctorID)
	if err != nil {
		return 0, fmt.Errorf("failed to resolve doctor ID: %w", err)
	}

	var prescriptionID int
	query := `SELECT create_prescription_with_items($1, $2, $3, $4, $5::jsonb)`
	err = tx.QueryRow(ctx, query, req.RecordID, doctorID, req.AppointmentID, req.Instructions, itemsJSON).Scan(&prescriptionID)
	if err != nil {
		return 0, err
	}

	return prescriptionID, nil
}

// GetPrescriptionByID retrieves a full prescription with its line items.
func (r *PrescriptionRepository) GetPrescriptionByID(ctx context.Context, id int) (*models.PrescriptionDetail, error) {
	tx := db.TxFromContext(ctx)

	query := `
		SELECT 
			prescription_id, appointment_id, prescription_date, instructions,
			doctor_first_name, doctor_last_name, 
			patient_id, patient_first_name, patient_last_name,
			record_id, record_date, diagnosis, treatment,
			prescription_item_id, medicine_name, medicine_info_link, dosage, quantity, duration_days
		FROM prescription_detail_view
		WHERE prescription_id = $1
	`
	rows, err := tx.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var detail *models.PrescriptionDetail

	for rows.Next() {
		var itemID *int
		var medName *string
		var medInfoLink *string
		var dosage *string
		var quantity *int
		var durationDays *int
		var header models.PrescriptionDetail

		err := rows.Scan(
			&header.PrescriptionID, &header.AppointmentID, &header.PrescriptionDate, &header.Instructions,
			&header.DoctorFirstName, &header.DoctorLastName,
			&header.PatientID, &header.PatientFirstName, &header.PatientLastName,
			&header.RecordID, &header.RecordDate, &header.Diagnosis, &header.Treatment,
			&itemID, &medName, &medInfoLink, &dosage, &quantity, &durationDays,
		)
		if err != nil {
			return nil, err
		}

		if detail == nil {
			detail = &header
			detail.Items = []models.PrescriptionDetailItem{}
		}
		
		if itemID != nil {
			item := models.PrescriptionDetailItem{
				PrescriptionItemID: *itemID,
			}
			if medName != nil {
				item.MedicineName = *medName
			}
			item.MedicineInfoLink = medInfoLink
			if dosage != nil {
				item.Dosage = *dosage
			}
			if quantity != nil {
				item.Quantity = *quantity
			}
			if durationDays != nil {
				item.DurationDays = *durationDays
			}
			detail.Items = append(detail.Items, item)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if detail == nil {
		return nil, utils.ErrNotFound
	}

	return detail, nil
}

// GetPrescriptions retrieves a summary list of prescriptions, optionally filtered.
func (r *PrescriptionRepository) GetPrescriptions(ctx context.Context, filterUserID, filterPatientID, filterDoctorID *int, limit, offset int) ([]models.PrescriptionSummary, error) {
	tx := db.TxFromContext(ctx)

	query := `
		SELECT 
			pr.prescription_id, pr.appointment_id, pr.prescription_date,
			e.first_name AS doctor_first_name, e.last_name AS doctor_last_name,
			mr.patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
			mr.record_id, mr.diagnosis
		FROM Prescriptions pr
		JOIN Doctors doc ON doc.doctor_id = pr.doctor_id
		JOIN Employees e ON e.employee_id = doc.employee_id
		JOIN Medical_Records mr ON mr.record_id = pr.record_id
		JOIN Patients p ON p.patient_id = mr.patient_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if filterUserID != nil {
		query += fmt.Sprintf(" AND p.user_id = $%d", argIndex)
		args = append(args, *filterUserID)
		argIndex++
	}
	if filterPatientID != nil {
		query += fmt.Sprintf(" AND p.patient_id = $%d", argIndex)
		args = append(args, *filterPatientID)
		argIndex++
	}
	if filterDoctorID != nil {
		query += fmt.Sprintf(" AND pr.doctor_id = $%d", argIndex)
		args = append(args, *filterDoctorID)
		argIndex++
	}

	query += fmt.Sprintf(" ORDER BY pr.prescription_date DESC, pr.prescription_id DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []models.PrescriptionSummary
	for rows.Next() {
		var s models.PrescriptionSummary
		if err := rows.Scan(
			&s.PrescriptionID, &s.AppointmentID, &s.PrescriptionDate,
			&s.DoctorFirstName, &s.DoctorLastName,
			&s.PatientID, &s.PatientFirstName, &s.PatientLastName,
			&s.RecordID, &s.Diagnosis,
		); err != nil {
			return nil, err
		}
		summaries = append(summaries, s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return summaries, nil
}

// VerifyPrescriptionOwnership checks if a prescription belongs to the given user (who is a patient).
func (r *PrescriptionRepository) VerifyPrescriptionOwnership(ctx context.Context, prescriptionID, userID int) (bool, error) {
	tx := db.TxFromContext(ctx)

	var exists bool
	query := `
		SELECT EXISTS (
			SELECT 1 FROM Prescriptions pr
			JOIN Medical_Records mr ON mr.record_id = pr.record_id
			JOIN Patients p ON p.patient_id = mr.patient_id
			WHERE pr.prescription_id = $1 AND p.user_id = $2
		)
	`
	err := tx.QueryRow(ctx, query, prescriptionID, userID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
