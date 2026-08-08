package repository

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/models"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type AppointmentRepository struct{}

func NewAppointmentRepository() *AppointmentRepository {
	return &AppointmentRepository{}
}

// BookAppointment books an appointment by calling the stored procedure.
func (r *AppointmentRepository) BookAppointment(ctx context.Context, patientID, doctorID int, date time.Time, appointmentType string, status string, notes string) (int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return 0, errors.New("no database transaction found in context")
	}

	var appointmentID int
	query := `SELECT book_appointment($1, $2, $3, $4, $5, $6)`
	err := tx.QueryRow(ctx, query, patientID, doctorID, date, appointmentType, status, notes).Scan(&appointmentID)
	if err != nil {
		return 0, err
	}
	return appointmentID, nil
}

// CancelAppointment cancels an appointment by calling the stored procedure.
func (r *AppointmentRepository) CancelAppointment(ctx context.Context, appointmentID int) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("no database transaction found in context")
	}

	query := `SELECT cancel_appointment($1)`
	_, err := tx.Exec(ctx, query, appointmentID)
	return err
}

// GetAppointments gets all appointments, optionally filtering by role, user ID, status, sort order, patient name, doctor name, and date.
func (r *AppointmentRepository) GetAppointments(ctx context.Context, role string, userID int, status, sort, patientName, doctorName, date string, limit, offset int) ([]models.Appointment, int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, 0, errors.New("no database transaction found in context")
	}

	baseQuery := ` FROM Appointments a 
		JOIN Doctors d ON a.doctor_id = d.doctor_id
		JOIN Employees e ON d.employee_id = e.employee_id
		JOIN Patients p ON a.patient_id = p.patient_id
	`
	args := []interface{}{}

	switch role {
	case "patient":
		baseQuery += ` WHERE a.patient_id = (SELECT patient_id FROM Patients WHERE user_id = $1)`
		args = append(args, userID)
	case "doctor":
		baseQuery += ` WHERE a.doctor_id = (SELECT doctor_id FROM Doctors JOIN Employees emp ON Doctors.employee_id = emp.employee_id WHERE emp.user_id = $1)`
		args = append(args, userID)
	default:
		baseQuery += ` WHERE 1=1`
	}

	if status != "" {
		statuses := strings.Split(status, ",")
		if len(statuses) == 1 {
			args = append(args, status)
			baseQuery += ` AND a.status = $` + strconv.Itoa(len(args))
		} else {
			var placeholders []string
			for _, s := range statuses {
				args = append(args, s)
				placeholders = append(placeholders, "$"+strconv.Itoa(len(args)))
			}
			baseQuery += ` AND a.status IN (` + strings.Join(placeholders, ", ") + `)`
		}
	}

	if patientName != "" {
		args = append(args, "%"+patientName+"%")
		baseQuery += ` AND (p.first_name ILIKE $` + strconv.Itoa(len(args)) + ` OR p.last_name ILIKE $` + strconv.Itoa(len(args)) + `)`
	}

	if doctorName != "" {
		args = append(args, "%"+doctorName+"%")
		baseQuery += ` AND (e.first_name ILIKE $` + strconv.Itoa(len(args)) + ` OR e.last_name ILIKE $` + strconv.Itoa(len(args)) + `)`
	}

	if date != "" {
		args = append(args, date)
		baseQuery += ` AND a.appointment_date = $` + strconv.Itoa(len(args))
	}

	var totalCount int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := tx.QueryRow(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT a.appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.serial_number, a.status, a.type, a.notes, a.created_at,
		       e.first_name AS doc_first, e.last_name AS doc_last, e.phone AS doc_phone, d.specialization,
			   p.first_name AS pat_first, p.last_name AS pat_last
	` + baseQuery
	
	orderClause := ` ORDER BY a.appointment_date DESC`
	if sort == "asc" {
		orderClause = ` ORDER BY a.appointment_date ASC`
	}
	
	query += orderClause + ` LIMIT $` + strconv.Itoa(len(args)+1) + ` OFFSET $` + strconv.Itoa(len(args)+2)
	args = append(args, limit, offset)

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var a models.Appointment
		var doc models.Doctor
		var pat models.Patient
		var notes *string
		if err := rows.Scan(
			&a.AppointmentID, &a.PatientID, &a.DoctorID, &a.AppointmentDate, &a.SerialNumber, &a.Status, &a.Type, &notes, &a.CreatedAt,
			&doc.FirstName, &doc.LastName, &doc.Phone, &doc.Specialization,
			&pat.FirstName, &pat.LastName,
		); err != nil {
			return nil, 0, err
		}
		
		if notes != nil {
			a.Notes = *notes
		}
		
		a.Doctor = &doc
		a.Patient = &pat
		appointments = append(appointments, a)
	}
	
	if appointments == nil {
		appointments = []models.Appointment{}
	}
	
	return appointments, totalCount, nil
}

// GetAppointmentByID retrieves a single appointment.
func (r *AppointmentRepository) GetAppointmentByID(ctx context.Context, appointmentID int) (*models.Appointment, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return nil, errors.New("no database transaction found in context")
	}

	query := `
		SELECT appointment_id, patient_id, doctor_id, appointment_date, serial_number, status, type, notes, created_at
		FROM Appointments
		WHERE appointment_id = $1
	`
	var a models.Appointment
	var notes *string

	err := tx.QueryRow(ctx, query, appointmentID).Scan(
		&a.AppointmentID,
		&a.PatientID,
		&a.DoctorID,
		&a.AppointmentDate,
		&a.SerialNumber,
		&a.Status,
		&a.Type,
		&notes,
		&a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if notes != nil {
		a.Notes = *notes
	}
	return &a, nil
}

// UpdateAppointmentStatus updates the status of an appointment.
func (r *AppointmentRepository) UpdateAppointmentStatus(ctx context.Context, appointmentID int, status string) error {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return errors.New("no database transaction found in context")
	}

	query := `UPDATE Appointments SET status = $2 WHERE appointment_id = $1`
	commandTag, err := tx.Exec(ctx, query, appointmentID, status)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return utils.ErrNotFound
	}
	return nil
}

// GetPatientIDByUserID retrieves the patient_id associated with a user_id.
func (r *AppointmentRepository) GetPatientIDByUserID(ctx context.Context, userID int) (int, error) {
	tx := db.TxFromContext(ctx)
	if tx == nil {
		return 0, errors.New("no database transaction found in context")
	}

	query := `SELECT patient_id FROM Patients WHERE user_id = $1`
	var patientID int
	err := tx.QueryRow(ctx, query, userID).Scan(&patientID)
	return patientID, err
}
