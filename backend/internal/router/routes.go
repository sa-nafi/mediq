package router

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
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

	// Handlers
	authHandler := handlers.NewAuthHandler(userRepo, patientRepo, cfg.JWTSecret)
	employeeHandler := handlers.NewEmployeeHandler(employeeRepo)
	doctorHandler := handlers.NewDoctorHandler(doctorRepo)
	departmentHandler := handlers.NewDepartmentHandler(departmentRepo)
	medicineHandler := handlers.NewMedicineHandler(medicineRepo)

	// Middlewares
	txMw := middleware.TransactionMiddleware(dbPool)

	// Health and readiness endpoints
	mux.HandleFunc("GET /api/health", handlers.HealthCheck)
	mux.HandleFunc("GET /api/ready", handlers.ReadyHandler(dbPool))

	// Auth routes (wrapped in transaction middleware)
	mux.Handle("POST /api/auth/register", txMw(http.HandlerFunc(authHandler.RegisterPatientHandler)))
	mux.Handle("POST /api/auth/login", txMw(http.HandlerFunc(authHandler.LoginHandler)))
	mux.Handle("POST /api/auth/refresh", txMw(http.HandlerFunc(authHandler.RefreshTokenHandler)))

	// Protected Auth routes
	authMw := middleware.RequireAuth(cfg.JWTSecret)
	mux.Handle("POST /api/auth/logout", authMw(txMw(http.HandlerFunc(authHandler.LogoutHandler))))

	// Admin middlewares
	adminMw := middleware.RequireRole("admin")
	adminAuthTx := func(h http.HandlerFunc) http.Handler {
		return authMw(adminMw(txMw(http.HandlerFunc(h))))
	}

	// Employee Routes
	mux.Handle("POST /api/employees", adminAuthTx(employeeHandler.CreateStaffHandler))
	mux.Handle("GET /api/employees", adminAuthTx(employeeHandler.GetEmployeesHandler))
	mux.Handle("GET /api/employees/{id}", adminAuthTx(employeeHandler.GetEmployeeByIDHandler))
	mux.Handle("PUT /api/employees/{id}", adminAuthTx(employeeHandler.UpdateEmployeeHandler))
	mux.Handle("DELETE /api/employees/{id}", adminAuthTx(employeeHandler.DeleteEmployeeHandler))

	// Doctor Routes
	mux.Handle("POST /api/doctors", adminAuthTx(doctorHandler.CreateDoctorHandler))
	mux.Handle("GET /api/doctors", adminAuthTx(doctorHandler.GetDoctorsHandler))
	mux.Handle("GET /api/doctors/{id}", adminAuthTx(doctorHandler.GetDoctorByIDHandler))
	mux.Handle("PUT /api/doctors/{id}", adminAuthTx(doctorHandler.UpdateDoctorHandler))
	mux.Handle("DELETE /api/doctors/{id}", adminAuthTx(doctorHandler.DeleteDoctorHandler))

	mux.Handle("GET /api/doctors/{id}/schedules", adminAuthTx(doctorHandler.GetDoctorSchedulesHandler))
	mux.Handle("PUT /api/doctors/{id}/schedules", adminAuthTx(doctorHandler.UpdateDoctorSchedulesHandler))

	mux.Handle("GET /api/doctors/{id}/leaves", adminAuthTx(doctorHandler.GetDoctorLeavesHandler))
	mux.Handle("POST /api/doctors/{id}/leaves", adminAuthTx(doctorHandler.CreateDoctorLeaveHandler))
	mux.Handle("DELETE /api/doctors/{id}/leaves/{leave_id}", adminAuthTx(doctorHandler.DeleteDoctorLeaveHandler))

	// Department Routes
	mux.Handle("POST /api/departments", adminAuthTx(departmentHandler.CreateDepartmentHandler))
	mux.Handle("GET /api/departments", adminAuthTx(departmentHandler.GetDepartmentsHandler))
	mux.Handle("GET /api/departments/{id}", adminAuthTx(departmentHandler.GetDepartmentByIDHandler))
	mux.Handle("PUT /api/departments/{id}", adminAuthTx(departmentHandler.UpdateDepartmentHandler))
	mux.Handle("DELETE /api/departments/{id}", adminAuthTx(departmentHandler.DeleteDepartmentHandler))

	// Medicine Routes
	mux.Handle("POST /api/medicines", adminAuthTx(medicineHandler.CreateMedicineHandler))
	mux.Handle("GET /api/medicines", adminAuthTx(medicineHandler.GetMedicinesHandler))
	mux.Handle("GET /api/medicines/{id}", adminAuthTx(medicineHandler.GetMedicineByIDHandler))
	mux.Handle("PUT /api/medicines/{id}", adminAuthTx(medicineHandler.UpdateMedicineHandler))
	mux.Handle("DELETE /api/medicines/{id}", adminAuthTx(medicineHandler.DeleteMedicineHandler))
}
