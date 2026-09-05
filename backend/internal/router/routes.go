package router

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sa-nafi/mediq/backend/internal/config"
	"github.com/sa-nafi/mediq/backend/internal/handlers"
	"github.com/sa-nafi/mediq/backend/internal/middleware"
	"github.com/sa-nafi/mediq/backend/internal/repository"
)

// RegisterRoutes sets up all the application routes on the given mux
func RegisterRoutes(mux *http.ServeMux, dbPool *pgxpool.Pool, cfg *config.Config) {
	// Repositories
	userRepo := repository.NewUserRepository()
	patientRepo := repository.NewPatientRepository()
	employeeRepo := repository.NewEmployeeRepository()
	doctorRepo := repository.NewDoctorRepository()
	departmentRepo := repository.NewDepartmentRepository()
	medicineRepo := repository.NewMedicineRepository()
	appointmentRepo := repository.NewAppointmentRepository()
	medicalRecordRepo := repository.NewMedicalRecordRepository()
	medicalTestRepo := repository.NewMedicalTestRepository()
	prescriptionRepo := repository.NewPrescriptionRepository()
	auditRepo := repository.NewAuditRepository()

	// Handlers
	authHandler := handlers.NewAuthHandler(userRepo, patientRepo, cfg.JWTSecret, cfg.CookieSecure)
	employeeHandler := handlers.NewEmployeeHandler(employeeRepo)
	doctorHandler := handlers.NewDoctorHandler(doctorRepo)
	departmentHandler := handlers.NewDepartmentHandler(departmentRepo)
	medicineHandler := handlers.NewMedicineHandler(medicineRepo)
	patientHandler := handlers.NewPatientHandler(patientRepo)
	appointmentHandler := handlers.NewAppointmentHandler(appointmentRepo)
	medicalRecordHandler := handlers.NewMedicalRecordHandler(medicalRecordRepo)
	medicalTestHandler := handlers.NewMedicalTestHandler(medicalTestRepo)
	prescriptionHandler := handlers.NewPrescriptionHandler(prescriptionRepo)
	adminHandler := handlers.NewAdminHandler(auditRepo)

	// Middlewares
	txMw := middleware.TransactionMiddleware(dbPool)
	authMw := middleware.RequireAuth(cfg.JWTSecret)

	// allow wraps a handler with auth → role-check → transaction middleware.
	// Roles are declared inline at each route for immediate readability.
	allow := func(roles ...string) func(http.HandlerFunc) http.Handler {
		return func(h http.HandlerFunc) http.Handler {
			return authMw(middleware.RequireRole(roles...)(txMw(http.HandlerFunc(h))))
		}
	}

	// Metrics endpoint for Prometheus
	mux.Handle("GET /metrics", promhttp.Handler())

	// Health and readiness endpoints
	mux.HandleFunc("GET /api/health", handlers.HealthCheck)
	mux.HandleFunc("GET /api/ready", handlers.ReadyHandler(dbPool))

	// Auth routes (wrapped in transaction middleware)
	mux.Handle("POST /api/auth/register", txMw(http.HandlerFunc(authHandler.RegisterPatientHandler)))
	mux.Handle("POST /api/auth/login", txMw(http.HandlerFunc(authHandler.LoginHandler)))
	mux.Handle("POST /api/auth/refresh", txMw(http.HandlerFunc(authHandler.RefreshTokenHandler)))

	// Protected Auth routes
	mux.Handle("POST /api/auth/logout", authMw(txMw(http.HandlerFunc(authHandler.LogoutHandler))))

	// Employee Routes
	mux.Handle("GET /api/employees/me", allow("doctor", "receptionist", "lab_tech", "admin")(employeeHandler.GetMyEmployeeProfileHandler))
	mux.Handle("POST /api/employees", allow("admin")(employeeHandler.CreateStaffHandler))
	mux.Handle("GET /api/employees", allow("admin")(employeeHandler.GetEmployeesHandler))
	mux.Handle("GET /api/employees/{id}", allow("admin")(employeeHandler.GetEmployeeByIDHandler))
	mux.Handle("PUT /api/employees/{id}", allow("admin")(employeeHandler.UpdateEmployeeHandler))
	mux.Handle("DELETE /api/employees/{id}", allow("admin")(employeeHandler.DeleteEmployeeHandler))

	// Doctor Routes
	mux.Handle("POST /api/doctors", allow("admin")(doctorHandler.CreateDoctorHandler))
	mux.Handle("GET /api/doctors", allow("patient", "doctor", "receptionist", "admin")(doctorHandler.GetDoctorsHandler))
	mux.Handle("GET /api/doctors/{id}", allow("patient", "doctor", "receptionist", "admin")(doctorHandler.GetDoctorByIDHandler))
	mux.Handle("PUT /api/doctors/{id}", allow("admin")(doctorHandler.UpdateDoctorHandler))
	mux.Handle("DELETE /api/doctors/{id}", allow("admin")(doctorHandler.DeleteDoctorHandler))

	mux.Handle("GET /api/doctors/{id}/schedules", allow("patient", "doctor", "receptionist", "admin")(doctorHandler.GetDoctorSchedulesHandler))
	mux.Handle("PUT /api/doctors/{id}/schedules", allow("admin")(doctorHandler.UpdateDoctorSchedulesHandler))

	mux.Handle("GET /api/doctors/{id}/availability", allow("patient", "doctor", "receptionist", "admin")(doctorHandler.GetDoctorAvailabilityHandler))

	mux.Handle("GET /api/doctors/{id}/leaves", allow("admin")(doctorHandler.GetDoctorLeavesHandler))
	mux.Handle("POST /api/doctors/{id}/leaves", allow("admin")(doctorHandler.CreateDoctorLeaveHandler))
	mux.Handle("DELETE /api/doctors/{id}/leaves/{leave_id}", allow("admin")(doctorHandler.DeleteDoctorLeaveHandler))

	// Department Routes
	mux.Handle("POST /api/departments", allow("admin")(departmentHandler.CreateDepartmentHandler))
	mux.Handle("GET /api/departments", allow("admin")(departmentHandler.GetDepartmentsHandler))
	mux.Handle("GET /api/departments/{id}", allow("admin")(departmentHandler.GetDepartmentByIDHandler))
	mux.Handle("PUT /api/departments/{id}", allow("admin")(departmentHandler.UpdateDepartmentHandler))
	mux.Handle("DELETE /api/departments/{id}", allow("admin")(departmentHandler.DeleteDepartmentHandler))

	// Medicine Routes
	mux.Handle("POST /api/medicines", allow("admin")(medicineHandler.CreateMedicineHandler))
	mux.Handle("GET /api/medicines", allow("patient", "doctor", "receptionist", "admin")(medicineHandler.GetMedicinesHandler))
	mux.Handle("GET /api/medicines/{id}", allow("patient", "doctor", "receptionist", "admin")(medicineHandler.GetMedicineByIDHandler))
	mux.Handle("PUT /api/medicines/{id}", allow("admin")(medicineHandler.UpdateMedicineHandler))
	mux.Handle("DELETE /api/medicines/{id}", allow("admin")(medicineHandler.DeleteMedicineHandler))

	// Patient Routes
	mux.Handle("GET /api/patients/me", allow("patient")(patientHandler.GetMyPatientProfileHandler))
	mux.Handle("PUT /api/patients/me", allow("patient")(patientHandler.UpdateMyPatientProfileHandler))
	mux.Handle("GET /api/patients", allow("receptionist", "doctor", "admin")(patientHandler.GetPatientsHandler))
	mux.Handle("GET /api/patients/{id}", allow("patient", "doctor", "receptionist", "admin")(patientHandler.GetPatientByIDHandler))
	mux.Handle("POST /api/patients/walk-in", allow("receptionist")(patientHandler.CreateWalkInPatientHandler))
	mux.Handle("PUT /api/patients/{id}", allow("patient", "admin")(patientHandler.UpdatePatientHandler))

	// Appointment Routes
	mux.Handle("POST /api/appointments", allow("patient")(appointmentHandler.CreateAppointmentHandler))
	mux.Handle("GET /api/appointments", allow("patient", "doctor", "receptionist")(appointmentHandler.GetAppointmentsHandler))
	mux.Handle("GET /api/appointments/{id}", allow("patient", "doctor", "receptionist")(appointmentHandler.GetAppointmentByIDHandler))
	mux.Handle("POST /api/appointments/book-for-patient", allow("receptionist")(appointmentHandler.CreateReceptionistAppointmentHandler))
	mux.Handle("PUT /api/appointments/{id}/cancel", allow("patient", "receptionist")(appointmentHandler.CancelAppointmentHandler))
	mux.Handle("PATCH /api/appointments/{id}/status", allow("doctor", "receptionist")(appointmentHandler.UpdateAppointmentStatusHandler))

	// Medical Record Routes
	mux.Handle("POST /api/medical-records", allow("doctor")(medicalRecordHandler.CreateMedicalRecordHandler))
	mux.Handle("GET /api/medical-records", allow("patient", "doctor")(medicalRecordHandler.GetMedicalRecordsHandler))
	mux.Handle("GET /api/medical-records/{id}", allow("patient", "doctor")(medicalRecordHandler.GetMedicalRecordByIDHandler))

	// Medical Test Routes
	mux.Handle("POST /api/medical-tests", allow("doctor")(medicalTestHandler.OrderMedicalTestHandler))
	mux.Handle("GET /api/medical-tests", allow("patient", "doctor", "lab_tech")(medicalTestHandler.GetTestsHandler))
	mux.Handle("GET /api/medical-tests/{id}", allow("patient", "doctor", "lab_tech")(medicalTestHandler.GetTestByIDHandler))
	mux.Handle("PUT /api/medical-tests/{id}", allow("lab_tech")(medicalTestHandler.UpdateMedicalTestHandler))

	// Prescription Routes
	mux.Handle("POST /api/prescriptions", allow("doctor")(prescriptionHandler.CreatePrescriptionHandler))
	mux.Handle("GET /api/prescriptions", allow("patient", "doctor")(prescriptionHandler.GetPrescriptionsHandler))
	mux.Handle("GET /api/prescriptions/{id}", allow("patient", "doctor")(prescriptionHandler.GetPrescriptionByIDHandler))

	// Admin Routes
	mux.Handle("GET /api/admin/audit-logs", allow("admin")(adminHandler.GetAuditLogsHandler))
	mux.Handle("GET /api/admin/audit-logs/{id}", allow("admin")(adminHandler.GetAuditLogByIDHandler))
}
