package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/sa-nafi/mediq/backend/internal/config"
	"github.com/sa-nafi/mediq/backend/internal/db"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

func main() {
	// Setup structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	reset := flag.Bool("reset", false, "Reset the database by truncating core tables before seeding")
	flag.Parse()

	slog.Info("Starting seeder", "reset_enabled", *reset)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer dbCancel()

	dbPool, err := db.NewPool(dbCtx, cfg)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer dbPool.Close()

	ctx := context.Background()

	// Start a single transaction for seeding
	tx, err := dbPool.Begin(ctx)
	if err != nil {
		slog.Error("Failed to begin transaction", "error", err)
		os.Exit(1)
	}
	defer tx.Rollback(ctx)

	// Since triggers might require app.current_user_id, we set it to NULL (default) or handle it safely.
	// We'll set it to 1 just in case, but since admin doesn't exist yet, we will just let it default to NULL
	// by not setting it, or if it raises an error, we will set it. Actually, `NULLIF(current_setting('app.current_user_id', true), '')`
	// handles unset gracefully as per 004_triggers.sql.

	if *reset {
		slog.Info("Truncating core tables...")
		_, err = tx.Exec(ctx, "TRUNCATE Users, Departments, Medicines RESTART IDENTITY CASCADE;")
		if err != nil {
			slog.Error("Failed to truncate tables", "error", err)
			os.Exit(1)
		}
	}

	// Helper for hashing
	hash, err := utils.HashPassword("test1234")
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		os.Exit(1)
	}

	// 1. Seed Departments
	slog.Info("Seeding Departments...")
	departments := []string{
		"Cardiology", "Neurology", "Orthopedics", "Pathology", "Radiology", "General Medicine",
	}
	deptIDs := make(map[string]int)
	for _, dept := range departments {
		var id int
		err := tx.QueryRow(ctx, "INSERT INTO Departments (department_name) VALUES ($1) ON CONFLICT (department_name) DO UPDATE SET department_name=EXCLUDED.department_name RETURNING department_id", dept).Scan(&id)
		if err != nil {
			slog.Error("Failed to insert department", "department", dept, "error", err)
			os.Exit(1)
		}
		deptIDs[dept] = id
	}

	// 2. Seed Medicines
	slog.Info("Seeding Medicines...")
	medicines := []struct{ name, category, link string }{
		{"Napa 500mg", "Paracetamol", "https://medex.com.bd/brands/7701/napa-500mg"},
		{"Seclo 20mg", "Omeprazole", "https://medex.com.bd/brands/9538/seclo-20mg"},
		{"Maxpro 20mg", "Esomeprazole", "https://medex.com.bd/brands/6758/maxpro-20mg"},
		{"Sergel 20mg", "Esomeprazole", "https://medex.com.bd/brands/8666/sergel-20mg"},
		{"Fexo 120mg", "Fexofenadine", "https://medex.com.bd/brands/4014/fexo-120mg"},
		{"Alatrol 10mg", "Cetirizine", "https://medex.com.bd/brands/115/alatrol"},
		{"Ceevit 250mg", "Vitamin C", "https://medex.com.bd/brands/3910/ceevit"},
		{"Bextram Gold", "Multivitamin & Multimineral", "https://medex.com.bd/brands/5053/bextram-gold"},
		{"Zimax 500mg", "Azithromycin", "https://medex.com.bd/brands/11384/zimax-500mg"},
		{"A-Cal DX", "Calcium + Vitamin D3", "https://medex.com.bd/brands/3/a-cal-dx"},
		{"Losectil 20mg", "Omeprazole", "https://medex.com.bd/brands/6362/losectil-20mg"},
		{"Comet 500mg", "Metformin", "https://medex.com.bd/brands/2479/comet-500mg"},
		{"Ecosprin 75mg", "Aspirin", "https://medex.com.bd/brands/3565/ecosprin-75mg"},
		{"Bizoran 5/20", "Amlodipine + Olmesartan", "https://medex.com.bd/brands/1569/bizoran-5-20"},
		{"Napa Extend 665mg", "Paracetamol", "https://medex.com.bd/brands/7708/napa-extend-665mg"},
	}
	for _, med := range medicines {
		_, err := tx.Exec(ctx, "INSERT INTO Medicines (medicine_name, category, info_link) SELECT $1::VARCHAR, $2::VARCHAR, $3::VARCHAR WHERE NOT EXISTS (SELECT 1 FROM Medicines WHERE medicine_name = $1)", med.name, med.category, med.link)
		if err != nil {
			slog.Error("Failed to insert medicine", "medicine", med.name, "error", err)
			os.Exit(1)
		}
	}

	// 3. Seed Admin
	slog.Info("Seeding Admin...")
	var adminUserID int
	err = tx.QueryRow(ctx, `
		INSERT INTO Users (email, password_hash, role, is_active)
		VALUES ($1, $2, 'admin', true)
		ON CONFLICT (email) DO UPDATE SET is_active=EXCLUDED.is_active
		RETURNING user_id`, "admin@mediq.com", hash).Scan(&adminUserID)
	if err != nil {
		slog.Error("Failed to insert admin user", "error", err)
		os.Exit(1)
	}

	// Create Employee profile for Admin
	_, err = tx.Exec(ctx, `
		INSERT INTO Employees (user_id, department_id, first_name, last_name, phone)
		VALUES ($1, NULL, 'System', 'Admin', '0000000000')
		ON CONFLICT (user_id) DO NOTHING`, adminUserID)
	if err != nil {
		slog.Error("Failed to insert admin employee", "error", err)
		os.Exit(1)
	}

	// 4. Seed Receptionist & Lab Techs
	slog.Info("Seeding Staff...")
	staffList := []struct {
		email, role, first, last string
	}{
		{"receptionist@mediq.com", "receptionist", "Jane", "Receptionist"},
		{"labtech1@mediq.com", "lab_tech", "Alan", "Labtech"},
		{"labtech2@mediq.com", "lab_tech", "Betty", "Labtech"},
	}
	for _, staff := range staffList {
		var uid int
		err := tx.QueryRow(ctx, "INSERT INTO Users (email, password_hash, role, is_active) VALUES ($1, $2, $3, true) ON CONFLICT (email) DO UPDATE SET is_active=EXCLUDED.is_active RETURNING user_id", staff.email, hash, staff.role).Scan(&uid)
		if err != nil {
			slog.Error("Failed to insert staff user", "email", staff.email, "error", err)
			os.Exit(1)
		}
		_, err = tx.Exec(ctx, "INSERT INTO Employees (user_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING", uid, staff.first, staff.last)
		if err != nil {
			slog.Error("Failed to insert staff employee", "email", staff.email, "error", err)
			os.Exit(1)
		}
	}

	// 5. Seed Doctors
	slog.Info("Seeding Doctors...")
	doctors := []struct {
		email, first, last, dept, spec, license string
		fee                                     float64
	}{
		{"doctor.cardio@mediq.com", "John", "Heart", "Cardiology", "Cardiologist", "MD1001", 500.00},
		{"doctor.neuro@mediq.com", "Sarah", "Brain", "Neurology", "Neurologist", "MD1002", 600.00},
		{"doctor.ortho@mediq.com", "Mike", "Bone", "Orthopedics", "Orthopedic Surgeon", "MD1003", 450.00},
		{"doctor.gen@mediq.com", "Emily", "Care", "General Medicine", "General Physician", "MD1004", 300.00},
	}

	for _, doc := range doctors {
		var uid int
		err := tx.QueryRow(ctx, "INSERT INTO Users (email, password_hash, role, is_active) VALUES ($1, $2, 'doctor', true) ON CONFLICT (email) DO UPDATE SET is_active=EXCLUDED.is_active RETURNING user_id", doc.email, hash).Scan(&uid)
		if err != nil {
			slog.Error("Failed to insert doctor user", "email", doc.email, "error", err)
			os.Exit(1)
		}

		var empID int
		err = tx.QueryRow(ctx, "INSERT INTO Employees (user_id, department_id, first_name, last_name) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET department_id=EXCLUDED.department_id RETURNING employee_id", uid, deptIDs[doc.dept], doc.first, doc.last).Scan(&empID)
		if err != nil {
			slog.Error("Failed to insert doctor employee", "email", doc.email, "error", err)
			os.Exit(1)
		}

		var docID int
		err = tx.QueryRow(ctx, "INSERT INTO Doctors (employee_id, specialization, license_number, consultation_fee) VALUES ($1, $2, $3, $4) ON CONFLICT (employee_id) DO UPDATE SET consultation_fee=EXCLUDED.consultation_fee RETURNING doctor_id", empID, doc.spec, doc.license, doc.fee).Scan(&docID)
		if err != nil {
			slog.Error("Failed to insert doctor profile", "email", doc.email, "error", err)
			os.Exit(1)
		}

		// Insert varied schedules
		// Doctor 1: Mon, Wed, Fri (09:00-13:00 and 15:00-19:00)
		// Doctor 2: Tue, Thu, Sat (10:00-16:00)
		// Doctor 3: Mon-Fri (08:00-14:00)
		// Doctor 4: Sun-Thu (14:00-20:00)
		switch doc.email {
		case "doctor.cardio@mediq.com":
			for _, day := range []int{1, 3, 5} {
				_, err = tx.Exec(ctx, "INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES ($1, $2, '09:00:00', '13:00:00', 10) ON CONFLICT (doctor_id, day_of_week) DO NOTHING", docID, day)
			}
			// Add a leave for tomorrow to test unavailability
			tomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
			_, err = tx.Exec(ctx, "INSERT INTO Doctor_Leaves (doctor_id, leave_date) VALUES ($1, $2) ON CONFLICT DO NOTHING", docID, tomorrow)
		case "doctor.neuro@mediq.com":
			for _, day := range []int{2, 4, 6} {
				_, err = tx.Exec(ctx, "INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES ($1, $2, '10:00:00', '16:00:00', 15) ON CONFLICT (doctor_id, day_of_week) DO NOTHING", docID, day)
			}
		case "doctor.ortho@mediq.com":
			for day := 1; day <= 5; day++ {
				_, err = tx.Exec(ctx, "INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES ($1, $2, '08:00:00', '14:00:00', 12) ON CONFLICT (doctor_id, day_of_week) DO NOTHING", docID, day)
			}
		default:
			for day := 0; day <= 4; day++ {
				_, err = tx.Exec(ctx, "INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES ($1, $2, '14:00:00', '20:00:00', 15) ON CONFLICT (doctor_id, day_of_week) DO NOTHING", docID, day)
			}
		}
	}

	// 6. Seed Patients
	slog.Info("Seeding Patients...")
	patients := []struct {
		email, first, last, dob, gender, blood string
	}{
		{"patient1@example.com", "Alice", "Smith", "1990-05-15", "F", "O+"},
		{"patient2@example.com", "Bob", "Johnson", "1985-08-20", "M", "A-"},
		{"patient3@example.com", "Charlie", "Brown", "2000-01-10", "M", "B+"},
	}
	for _, pat := range patients {
		var uid int
		err := tx.QueryRow(ctx, "INSERT INTO Users (email, password_hash, role, is_active) VALUES ($1, $2, 'patient', true) ON CONFLICT (email) DO UPDATE SET is_active=EXCLUDED.is_active RETURNING user_id", pat.email, hash).Scan(&uid)
		if err != nil {
			slog.Error("Failed to insert patient user", "email", pat.email, "error", err)
			os.Exit(1)
		}

		_, err = tx.Exec(ctx, "INSERT INTO Patients (user_id, first_name, last_name, date_of_birth, gender, blood_type) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING", uid, pat.first, pat.last, pat.dob, pat.gender, pat.blood)
		if err != nil {
			slog.Error("Failed to insert patient profile", "email", pat.email, "error", err)
			os.Exit(1)
		}
	}

	// 7. Extended Seeding (Appointments, Records, Tests, Prescriptions)

	slog.Info("Fetching IDs for related data seeding...")
	var p1, p2, p3, d1, d2, d3, d4, labTechID int
	tx.QueryRow(ctx, "SELECT patient_id FROM Patients JOIN Users ON Patients.user_id = Users.user_id WHERE Users.email = $1", "patient1@example.com").Scan(&p1)
	tx.QueryRow(ctx, "SELECT patient_id FROM Patients JOIN Users ON Patients.user_id = Users.user_id WHERE Users.email = $1", "patient2@example.com").Scan(&p2)
	tx.QueryRow(ctx, "SELECT patient_id FROM Patients JOIN Users ON Patients.user_id = Users.user_id WHERE Users.email = $1", "patient3@example.com").Scan(&p3)

	tx.QueryRow(ctx, "SELECT doctor_id FROM Doctors JOIN Employees ON Doctors.employee_id = Employees.employee_id JOIN Users ON Employees.user_id = Users.user_id WHERE Users.email = $1", "doctor.cardio@mediq.com").Scan(&d1)
	tx.QueryRow(ctx, "SELECT doctor_id FROM Doctors JOIN Employees ON Doctors.employee_id = Employees.employee_id JOIN Users ON Employees.user_id = Users.user_id WHERE Users.email = $1", "doctor.neuro@mediq.com").Scan(&d2)
	tx.QueryRow(ctx, "SELECT doctor_id FROM Doctors JOIN Employees ON Doctors.employee_id = Employees.employee_id JOIN Users ON Employees.user_id = Users.user_id WHERE Users.email = $1", "doctor.ortho@mediq.com").Scan(&d3)
	tx.QueryRow(ctx, "SELECT doctor_id FROM Doctors JOIN Employees ON Doctors.employee_id = Employees.employee_id JOIN Users ON Employees.user_id = Users.user_id WHERE Users.email = $1", "doctor.gen@mediq.com").Scan(&d4)

	tx.QueryRow(ctx, "SELECT employee_id FROM Employees JOIN Users ON Employees.user_id = Users.user_id WHERE Users.email = $1", "labtech1@mediq.com").Scan(&labTechID)

	slog.Info("Seeding Appointments, Records, Tests, and Prescriptions...")
	// Helper to find the most recent/upcoming specific day of the week
	getDate := func(targetWeekday int, future bool) string {
		now := time.Now()
		offset := (targetWeekday - int(now.Weekday()) + 7) % 7
		if !future {
			offset -= 7
		}
		if offset == 0 && !future {
			offset = -7
		} else if offset == 0 && future {
			offset = 7
		}
		return now.AddDate(0, 0, offset).Format("2006-01-02")
	}

	appts := []struct {
		patientID int
		doctorID  int
		date      string
		serial    int
		status    string
		type_     string
		notes     string
		// For records
		diagnosis string
		treatment string
		// For tests
		testName   string
		testStatus string
		testResult *string
		compDate   *string
		// For prescription
		medNames []string
	}{
		// Patient 1 (3 appointments)
		// d4 (Gen) works Sun-Thu. target: 0 (Sun). Past.
		{p1, d4, getDate(0, false), 1, "completed", "new", "Patient feeling unwell", "Common Cold", "Rest and hydration", "Blood Test (CBC)", "completed", func(s string) *string { return &s }("Normal"), func(s string) *string { return &s }(getDate(0, false)), []string{"Napa 500mg", "Ceevit 250mg"}},
		// d1 (Cardio) works Mon,Wed,Fri. target: 1 (Mon). Future.
		{p1, d1, getDate(1, true), 1, "scheduled", "follow-up", "Checkup for hypertension", "", "", "Lipid Profile", "ordered", nil, nil, nil},
		// d2 (Neuro) works Tue,Thu,Sat. target: 2 (Tue). Past.
		{p1, d2, getDate(2, false), 1, "cancelled", "new", "Headaches", "", "", "", "", nil, nil, nil},

		// Patient 2 (3 appointments)
		// d3 (Ortho) works Mon-Fri. target: 3 (Wed). Past.
		{p2, d3, getDate(3, false), 1, "completed", "new", "Knee pain", "Mild Arthritis", "Physiotherapy", "X-Ray Knee", "completed", func(s string) *string { return &s }("Mild degeneration"), func(s string) *string { return &s }(getDate(3, false)), []string{"Napa 500mg"}},
		// d1 (Cardio) works Mon,Wed,Fri. target: 5 (Fri). Past.
		{p2, d1, getDate(5, false), 1, "completed", "follow-up", "Heart check", "Normal", "Keep up good diet", "ECG", "in_progress", nil, nil, nil},
		// d4 (Gen) works Sun-Thu. target: 4 (Thu). Past.
		{p2, d4, getDate(4, false), 1, "cancelled", "new", "Fever", "", "", "", "", nil, nil, nil},

		// Patient 3 (3 appointments)
		// d4 (Gen) works Sun-Thu. target: 1 (Mon). Past.
		{p3, d4, getDate(1, false), 1, "completed", "new", "Stomach ache", "Gastritis", "Avoid spicy food", "Endoscopy", "cancelled", nil, nil, []string{"Seclo 20mg", "Sergel 20mg"}},
		// d2 (Neuro) works Tue,Thu,Sat. target: 4 (Thu). Past.
		{p3, d2, getDate(4, false), 1, "completed", "new", "Nerve pain", "Neuropathy", "Medication", "Nerve Conduction Study", "completed", func(s string) *string { return &s }("Mild slowing"), func(s string) *string { return &s }(getDate(4, false)), []string{"Bextram Gold"}},
		// d1 (Cardio) works Mon,Wed,Fri. target: 3 (Wed). Future.
		{p3, d1, getDate(3, true), 1, "scheduled", "new", "Palpitations", "", "", "", "", nil, nil, nil},
	}

	for _, a := range appts {
		if a.patientID == 0 || a.doctorID == 0 {
			continue // Skip if IDs are missing
		}

		// Insert Appointment
		var apptID int
		err = tx.QueryRow(ctx, "SELECT appointment_id FROM Appointments WHERE doctor_id = $1 AND appointment_date = $2 AND serial_number = $3", a.doctorID, a.date, a.serial).Scan(&apptID)
		if err != nil {
			err = tx.QueryRow(ctx, `
				INSERT INTO Appointments (patient_id, doctor_id, appointment_date, serial_number, status, type, notes) 
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING appointment_id
			`, a.patientID, a.doctorID, a.date, a.serial, a.status, a.type_, a.notes).Scan(&apptID)
			if err != nil {
				slog.Error("Failed to insert appointment", "error", err)
				continue
			}
		} else {
			// Appointment already exists, assume its children are also seeded
			continue
		}

		// Insert Medical Record for scheduled and completed
		if a.status == "completed" || a.status == "scheduled" {
			var recordID int
			err = tx.QueryRow(ctx, `
				INSERT INTO Medical_Records (patient_id, doctor_id, appointment_id, record_date, diagnosis, treatment, notes)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING record_id
			`, a.patientID, a.doctorID, apptID, a.date, a.diagnosis, a.treatment, a.notes).Scan(&recordID)

			if err != nil {
				slog.Error("Failed to insert medical record", "error", err)
				continue
			}

			// Insert Prescription if we have meds
			if len(a.medNames) > 0 && a.status == "completed" {
				var prescID int
				err = tx.QueryRow(ctx, `
					INSERT INTO Prescriptions (record_id, doctor_id, appointment_id, prescription_date, instructions)
					VALUES ($1, $2, $3, $4, 'Take as directed')
					RETURNING prescription_id
				`, recordID, a.doctorID, apptID, a.date).Scan(&prescID)

				if err == nil {
					for _, medName := range a.medNames {
						var medID int
						tx.QueryRow(ctx, "SELECT medicine_id FROM Medicines WHERE medicine_name = $1", medName).Scan(&medID)
						if medID != 0 {
							tx.Exec(ctx, `
								INSERT INTO Prescription_Items (prescription_id, medicine_id, dosage, quantity, duration_days)
								VALUES ($1, $2, '1 tablet daily', 10, 10)
							`, prescID, medID)
						}
					}
				}
			}
		}

		// Insert Medical Test
		if a.testName != "" {
			var performedBy *int
			if (a.testStatus == "completed" || a.testStatus == "in_progress") && labTechID != 0 {
				performedBy = &labTechID
			}
			_, err = tx.Exec(ctx, `
				INSERT INTO Medical_Tests (patient_id, doctor_id, appointment_id, performed_by, test_name, test_details, status, result, ordered_date, completed_date)
				VALUES ($1, $2, $3, $4, $5, 'Routine test details', $6, $7, $8, $9)
			`, a.patientID, a.doctorID, apptID, performedBy, a.testName, a.testStatus, a.testResult, a.date, a.compDate)
			if err != nil {
				slog.Error("Failed to insert medical test", "error", err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("Failed to commit transaction", "error", err)
		os.Exit(1)
	}

	slog.Info("Database seeded successfully!")
	fmt.Println("--------------------------------------------------")
	fmt.Println("Seed Data Summary:")
	fmt.Println("Admin: admin@mediq.com / test1234")
	fmt.Println("Receptionist: receptionist@mediq.com / test1234")
	fmt.Println("Lab Techs: labtech1@mediq.com, labtech2@mediq.com / test1234")
	fmt.Println("Doctors: doctor.cardio@mediq.com, doctor.neuro@mediq.com, doctor.ortho@mediq.com, doctor.gen@mediq.com / test1234")
	fmt.Println("Patients: patient1@example.com, patient2@example.com, patient3@example.com / test1234")
	fmt.Println("--------------------------------------------------")
}
