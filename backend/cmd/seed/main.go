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
	hash, err := utils.HashPassword("password123")
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
	medicines := []struct{ name, category string }{
		{"Aspirin 500mg", "Painkiller"},
		{"Amoxicillin 250mg", "Antibiotic"},
		{"Paracetamol 500mg", "Painkiller"},
		{"Lisinopril 10mg", "Blood Pressure"},
		{"Metformin 500mg", "Diabetes"},
		{"Ibuprofen 400mg", "Painkiller"},
		{"Omeprazole 20mg", "Antacid"},
		{"Atorvastatin 20mg", "Cholesterol"},
		{"Azithromycin 250mg", "Antibiotic"},
		{"Cetirizine 10mg", "Antihistamine"},
	}
	for _, med := range medicines {
		_, err := tx.Exec(ctx, "INSERT INTO Medicines (medicine_name, category) VALUES ($1, $2)", med.name, med.category)
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

		// Insert schedules (Mon-Fri)
		for day := 1; day <= 5; day++ {
			_, err = tx.Exec(ctx, "INSERT INTO Doctor_Schedules (doctor_id, day_of_week, start_time, end_time, max_patients) VALUES ($1, $2, '09:00:00', '17:00:00', 20) ON CONFLICT (doctor_id, day_of_week) DO NOTHING", docID, day)
			if err != nil {
				slog.Error("Failed to insert doctor schedule", "email", doc.email, "error", err)
				os.Exit(1)
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

	if err := tx.Commit(ctx); err != nil {
		slog.Error("Failed to commit transaction", "error", err)
		os.Exit(1)
	}

	slog.Info("Database seeded successfully!")
	fmt.Println("--------------------------------------------------")
	fmt.Println("Seed Data Summary:")
	fmt.Println("Admin: admin@mediq.com / password123")
	fmt.Println("Receptionist: receptionist@mediq.com / password123")
	fmt.Println("Lab Techs: labtech1@mediq.com, labtech2@mediq.com / password123")
	fmt.Println("Doctors: doctor.cardio@mediq.com, doctor.neuro@mediq.com, doctor.ortho@mediq.com, doctor.gen@mediq.com / password123")
	fmt.Println("Patients: patient1@example.com, patient2@example.com, patient3@example.com / password123")
	fmt.Println("--------------------------------------------------")
}
