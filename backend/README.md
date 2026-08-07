# MediQ Backend

MediQ is a comprehensive hospital management system backend built with Go and PostgreSQL. It relies entirely on standard library routing (Go 1.22+) and raw SQL via `pgx` to keep dependencies minimal and performance high.

*(For local development startup instructions, please see the [main README](../README.md).)*

## Backend Guide

This section serves as the single source of truth for the project's backend design decisions and architecture.

### Tech Stack

- **Frontend**: React
- **Backend**: Go, standard library `net/http` (Go 1.22+ built-in mux —
  method + path-pattern routing, e.g. `mux.HandleFunc("POST /appointments", ...)`).
  No external router library.
- **Database**: PostgreSQL
- **Auth**: JWT, roles embedded in token claims, checked via Go middleware.
  No DB-level roles/RLS — authorization is entirely in the app layer.
- **DB access**: no ORM. Raw SQL via a Postgres driver (e.g. `pgx`), calling
  named views and stored procedures directly — this is deliberate, so the
  DBMS coursework (views/procedures/triggers) stays visible and isn't
  hidden behind ORM abstraction.

### Roles (5)

`patient`, `doctor`, `lab_tech`, `receptionist`, `admin` — stored as a
single `role` value on `Users`.

- **patient** — self-registers. Books appointments, views own records/
  tests/prescriptions.
- **doctor** — created by admin only. Consults, writes medical records,
  orders tests, prescribes medicine. Referenced as a FK across most
  clinical tables.
- **lab_tech** — created by admin only. Performs/completes diagnostic
  tests. Plain `Employees` row, no dedicated table — distinguished only
  by `Users.role`. Tracked via `Medical_Tests.performed_by`.
- **receptionist** — created by admin only. Front-desk duties (patient
  check-in, verbally telling patients which room to go). Plain
  `Employees` row, no dedicated table, no extra tracked data — purely a
  permission/role distinction in Go middleware.
- **admin** — created via a one-off seed script (not through the API,
  since only patients can self-register and there's no bootstrap admin
  otherwise). Manages doctors/staff/departments, views audit log.

**Only patients can self-register** via `POST /auth/register`. Doctor,
lab_tech, receptionist, and admin accounts are all created by an admin
through role-protected endpoints (e.g. `POST /doctors`, `POST /employees`).

### Database Schema (15 tables)

All tables and relationships, as actually defined in `001_schema.sql`:

```
Users (user_id PK, public_id UNIQUE, email, password_hash, role, is_active, created_at)
  role CHECK IN ('patient','doctor','lab_tech','receptionist','admin')

Departments (department_id PK, department_name, description)

Employees (employee_id PK, user_id FK→Users UNIQUE, department_id FK→Departments,
           first_name, last_name, phone, hire_date)
  -- common profile for doctor/lab_tech/receptionist/admin staff.
  -- lab_tech and receptionist are PLAIN Employees rows — no extra table.

Patients (patient_id PK, user_id FK→Users UNIQUE, first_name, last_name,
          date_of_birth, gender, blood_type, phone, address)

Doctors (doctor_id PK, employee_id FK→Employees UNIQUE, specialization,
         license_number UNIQUE, consultation_fee)

Doctor_Schedules (schedule_id PK, doctor_id FK→Doctors, day_of_week, start_time, end_time, max_patients)

Doctor_Leaves (leave_id PK, doctor_id FK→Doctors, leave_date)

Appointments (appointment_id PK, patient_id FK→Patients, doctor_id FK→Doctors,
              appointment_date, serial_number, type, status, notes, created_at)
  status CHECK IN ('scheduled','completed','cancelled','no_show')
  UNIQUE (doctor_id, appointment_date, serial_number)  -- no double-booking

Medical_Records (record_id PK, patient_id FK→Patients, doctor_id FK→Doctors,
                  appointment_id FK→Appointments NULLABLE, record_date,
                  diagnosis, treatment, notes)

Medical_Tests (test_id PK, patient_id FK→Patients, doctor_id FK→Doctors [ordered by],
       appointment_id FK→Appointments NULLABLE,
       performed_by FK→Employees NULLABLE [lab_tech who ran it],
       test_name, test_details, status, result, ordered_date, completed_date)
  status CHECK IN ('ordered','in_progress','completed','cancelled')
  -- NOTE: performed_by FKs to Employees directly (no LabTech table exists).
  -- App layer MUST verify that employee's Users.role = 'lab_tech' before
  -- allowing them to complete a test — the FK alone doesn't enforce this.

Medicines (medicine_id PK, medicine_name, category)
  -- PURE REFERENCE CATALOG. No stock_quantity, no unit_price, no expiry.
  -- Exists only so Prescription_Items has a consistent drug to point at.

Prescriptions (prescription_id PK, record_id FK→Medical_Records,
                doctor_id FK→Doctors, appointment_id FK→Appointments, prescription_date, instructions)

Prescription_Items (prescription_item_id PK, prescription_id FK→Prescriptions,
                     medicine_id FK→Medicines, dosage, quantity, duration_days)

Audit_Log (audit_id PK, table_name, record_id, action, old_data JSONB,
           new_data JSONB, changed_by, changed_at)
  action CHECK IN ('INSERT','UPDATE','DELETE')
  -- Populated ENTIRELY by triggers. Never written to directly by app code.

Refresh_Tokens (token_id PK, user_id FK→Users, expires_at, is_revoked)
```

#### Key relationship chains worth understanding

- `Users` → `Patients` (patient self-registration: 2-table insert)
- `Users` → `Employees` → `Doctors` (admin creates doctor: 3-table insert)
- `Users` → `Employees` (admin creates lab_tech/receptionist: 2-table insert,
  no 3rd table — role alone distinguishes them)
- `Medical_Records` → `Prescriptions` → `Prescription_Items` (a prescription
  can FK to the record and optionally an appointment)
- `Medical_Tests.doctor_id` (who ordered) vs `Medical_Tests.performed_by` (who ran it) are
  two distinct FKs — don't conflate them

### Views (`002_views.sql`)

Read-side, used directly by repo functions instead of inline joins:

| View | Purpose |
|---|---|
| `patient_summary_view` | Per-patient aggregate counts (appointments, records, tests) |
| `doctor_schedule_view` | Doctor's appointments joined with patient info |
| `test_detail_view` | Full test detail including ordering doctor + performing lab-tech |
| `prescription_detail_view` | Prescription header + line items + doctor name, joined |

### Stored Procedures/Functions (`003_functions.sql`)

Business logic lives here, not in Go — repo layer calls these:

| Function | Purpose |
|---|---|
| `book_appointment(...)` | Inserts appointment |
| `cancel_appointment(id)` | Cancels only if status is still `scheduled`; raises otherwise |
| `create_prescription_with_items(record_id, doctor_id, appointment_id, instructions, items JSONB)` | Atomic header + N line-item insert from one JSON payload |

### Triggers (`004_triggers.sql`)

One generic function, `audit_trigger_func()`, attached via `AFTER INSERT OR
UPDATE OR DELETE` to **the core clinical tables** — 11
triggers total, one each on: Users, Departments, Employees, Patients,
Doctors, Appointments, Medical_Records, Medical_Tests, Medicines, Prescriptions,
Prescription_Items. (Note: `Doctor_Schedules`, `Doctor_Leaves`, and `Refresh_Tokens` are not audited).

Additionally, there is a `trg_assign_appointment_serial` trigger on `Appointments` that calls `assign_appointment_serial()` to auto-calculate the patient's `serial_number` and ensure the doctor's daily `max_patients` limit is not exceeded.

**How `changed_by` gets populated**: the trigger reads a Postgres session
variable, `current_setting('app.current_user_id', true)`. This is NULL
unless something sets it first. **The Go app must run `SET LOCAL
app.current_user_id = '<user_id>'` at the start of every request's DB
transaction** — this is `internal/middleware/transaction.go`'s job (see
below). Without that middleware, every audit entry will have `changed_by
= NULL`.

No other triggers exist. (Stock-deduction trigger was designed then
removed along with the logistics/stock decision — do not re-add.)

### Go Backend File Structure

```
backend/
├── cmd/server/
│   └── main.go                 # config, DB pool, router, start server
├── internal/
│   ├── config/
│   │   └── config.go            # Config struct + Load() from env/.env
│   ├── db/
│   │   └── postgres.go          # pgx pool setup, connect, health check
│   ├── models/                  # plain structs, no logic, no SQL
│   │   ├── user.go
│   │   ├── employee.go
│   │   ├── department.go
│   │   ├── patient.go
│   │   ├── doctor.go
│   │   ├── appointment.go
│   │   ├── medical_record.go
│   │   ├── medical_test.go
│   │   ├── medicine.go
│   │   ├── prescription.go       # holds BOTH Prescription and PrescriptionItem structs
│   │   └── audit_log.go
│   ├── repository/              # ALL SQL lives here — calls views/procedures
│   │   ├── user.go
│   │   ├── employee.go
│   │   ├── department.go
│   │   ├── patient.go
│   │   ├── doctor.go
│   │   ├── appointment.go        # calls book_appointment(), cancel_appointment()
│   │   ├── medical_record.go
│   │   ├── medical_test.go                # calls complete_test(); MUST verify performed_by role='lab_tech'
│   │   ├── medicine.go
│   │   ├── prescription.go        # calls create_prescription_with_items()
│   │   └── audit.go               # reads Audit_Log only, no writes
│   ├── handlers/                # HTTP only — parse request, call repo, write response
│   │   ├── auth.go                # Register (patient only), Login, RefreshToken
│   │   ├── employee.go            # admin creates doctor/lab_tech/receptionist accounts
│   │   ├── department.go
│   │   ├── patient.go
│   │   ├── doctor.go
│   │   ├── appointment.go
│   │   ├── medical_record.go
│   │   ├── medical_test.go                # doctor orders, lab_tech completes
│   │   ├── medicine.go
│   │   ├── prescription.go
│   │   ├── admin.go               # audit log viewing, admin-only aggregate endpoints
│   │   └── dashboard.go           # composes multiple repo calls, no own model/repo
│   ├── middleware/
│   │   ├── auth.go                # RequireAuth (parses JWT), RequireRole(roles...)
│   │   ├── logging.go             # request logging
│   │   └── transaction.go         # wraps request in DB tx, SETs app.current_user_id
│   ├── router/
│   │   └── routes.go              # single file registering all routes
│   └── utils/
│       ├── jwt.go                  # sign/verify JWT
│       ├── password.go             # bcrypt hash/verify
│       └── response.go             # WriteJSON, WriteError helpers
├── migrations/
│   ├── 001_schema.sql
│   ├── 002_views.sql
│   ├── 003_functions.sql
│   └── 004_triggers.sql
├── .env
├── go.mod
└── go.sum
```

#### Layer responsibilities (strict separation)

- **`models/`** — data shape only. No SQL, no HTTP, no logic.
- **`repository/`** — all SQL. Calls views for reads (`SELECT * FROM
  x_view WHERE ...`), calls stored procedures for writes (`SELECT *
  FROM some_func(...)` or via `Exec`/`QueryRow`). Returns model structs.
  Never touches `http.ResponseWriter` or `http.Request`.
- **`handlers/`** — HTTP only. Parse JSON body / URL params / query
  params, call one or more repository functions, respond via
  `utils/response.go`. Never writes raw SQL.
- **`middleware/`** — cross-cutting concerns applied before/around
  handlers: identity (auth.go), observability (logging.go), and the
  audit-trigger plumbing (transaction.go). Order matters:
  logging → auth → transaction → handler.

#### Two-/three-table inserts to remember when implementing registration

- Patient self-register: `Users` → `Patients` (handled in `handlers/auth.go`)
- Admin creates doctor: `Users` → `Employees` → `Doctors` (in `handlers/doctor.go` or `employee.go`, admin-only)
- Admin creates lab_tech/receptionist: `Users` → `Employees` only (in `handlers/employee.go`, admin-only)

All of these should happen inside the transaction that `middleware/
transaction.go` already opens per-request, so the audit trigger correctly
attributes the inserts to the acting admin/patient.

### Bootstrapping

Since only patients can self-register, the database starts with **zero admins**. Initial database seeding (including initial admin, staff, doctor, patient accounts, departments, and medicines) is performed using the Go seeder tool located in [`cmd/seed/main.go`](cmd/seed/main.go).

#### Seeding Tutorial

##### Prerequisites
Ensure your PostgreSQL database is running and all database migrations (`001_schema.sql` through `007_procedures.sql`) have been applied.

##### Running the Seeder

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Run the seeding command:
   ```bash
   go run cmd/seed/main.go
   ```

##### Resetting & Re-seeding (Optional)
To truncate core tables (`Users`, `Departments`, `Medicines`) and restart identity sequences before seeding, pass the `-reset` flag:
```bash
go run cmd/seed/main.go -reset
```

#### Seeded Accounts & Credentials Summary

All seeded user accounts share the default password: **`test1234`**

| Role | Email | Details |
| --- | --- | --- |
| **Admin** | `admin@mediq.com` | System administrator with full privileges |
| **Receptionist** | `receptionist@mediq.com` | Front desk staff |
| **Lab Tech** | `labtech1@mediq.com`<br>`labtech2@mediq.com` | Laboratory technicians |
| **Doctor** | `doctor.cardio@mediq.com`<br>`doctor.neuro@mediq.com`<br>`doctor.ortho@mediq.com`<br>`doctor.gen@mediq.com` | Doctors with assigned departments & Mon–Fri 09:00–17:00 schedules |
| **Patient** | `patient1@example.com`<br>`patient2@example.com`<br>`patient3@example.com` | Test patient profiles |

#### Seeded Reference Catalog Data

- **Departments**: Cardiology, Neurology, Orthopedics, Pathology, Radiology, General Medicine
- **Medicines**: Aspirin 500mg, Amoxicillin 250mg, Paracetamol 500mg, Lisinopril 10mg, Metformin 500mg, Ibuprofen 400mg, Omeprazole 20mg, Atorvastatin 20mg, Azithromycin 250mg, Cetirizine 10mg


## API Specifications

The following endpoints are currently implemented and exposed by the backend.

### System & Health

#### `GET /api/health`
Checks if the HTTP server is running.
- **Auth Required**: No
- **Response**: `200 OK` (plain text or JSON indicating service is alive)

#### `GET /api/ready`
Checks if the application is fully ready to accept traffic, including database connectivity.
- **Auth Required**: No
- **Response**: `200 OK` (if DB is connected), `503 Service Unavailable` otherwise.

---

### Authentication

#### `POST /api/auth/register`
Registers a new patient in the system.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "strongpassword",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "gender": "M",          // optional
      "blood_type": "O+",     // optional
      "phone": "1234567890",  // optional
      "address": "123 Main"   // optional
  }
  ```
- **Response**: `201 Created`

#### `POST /api/auth/login`
Authenticates a user and issues JWT access and refresh tokens.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "strongpassword"
  }
  ```
- **Response**: `200 OK`
  - **Body**: 
    ```json
    {
        "access_token": "eyJhbG..."
    }
    ```
  - **Headers**: Sets `refresh_token` as an `HttpOnly` cookie.

#### `POST /api/auth/refresh`
Issues a new access token and rotates the refresh token using a valid, unexpired refresh token.
- **Auth Required**: No (but requires a valid `refresh_token` cookie)
- **Request Body**: None
- **Response**: `200 OK`
  - **Body**: 
    ```json
    {
        "access_token": "eyJhbG..."
    }
    ```
  - **Headers**: Updates the `refresh_token` `HttpOnly` cookie.

#### `POST /api/auth/logout`
Logs the user out by revoking their active refresh token in the database and clearing the cookie.
- **Auth Required**: Yes (Bearer Token and valid `refresh_token` cookie)
- **Request Body**: None
- **Response**: `200 OK`
  - **Headers**: Clears the `refresh_token` cookie.

---

### Employees (Admin Only)

#### `POST /api/employees`
Create a new employee (e.g., receptionist, lab_tech, admin).
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "email": "employee@example.com",
      "password": "test1234",
      "role": "receptionist",
      "department_id": 1,         // optional
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "0987654321",      // optional
      "hire_date": "2023-01-15"   // YYYY-MM-DD format
  }
  ```
- **Response**: `201 Created`

#### `GET /api/employees`
Get a paginated list of employees. Supports `?limit` and `?offset` and `?role`.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK` (Paginated list of employees)

#### `GET /api/employees/{id}`
Get a specific employee by ID.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `PUT /api/employees/{id}`
Update employee details.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "department_id": 2,         // optional
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "0987654321"       // optional
  }
  ```
- **Response**: `200 OK`

#### `DELETE /api/employees/{id}`
Deactivate an employee.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

---

### Doctors (Admin Only)

#### `POST /api/doctors`
Create a new doctor profile.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "email": "doctor@example.com",
      "password": "test1234",
      "department_id": 1,         // optional
      "first_name": "Gregory",
      "last_name": "House",
      "phone": "555-0199",        // optional
      "hire_date": "2010-05-20",  // YYYY-MM-DD
      "specialization": "Diagnostician", // optional
      "license_number": "MD123456",
      "consultation_fee": 150.00
  }
  ```
- **Response**: `201 Created`

#### `GET /api/doctors`
Get a paginated list of doctors. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK` (Paginated list of doctors)

#### `GET /api/doctors/{id}`
Get a specific doctor by ID.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `PUT /api/doctors/{id}`
Update doctor details.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "department_id": 1,         // optional
      "first_name": "Gregory",
      "last_name": "House",
      "phone": "555-0199",        // optional
      "specialization": "Diagnostician", // optional
      "consultation_fee": 200.00
  }
  ```
- **Response**: `200 OK`

#### `DELETE /api/doctors/{id}`
Deactivate a doctor profile.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `GET /api/doctors/{id}/schedules`
Get a doctor's weekly schedule.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `PUT /api/doctors/{id}/schedules`
Update a doctor's weekly schedule.
- **Auth Required**: Yes (Admin)
- **Request Body**: Array of schedule objects
  ```json
  [
      {
          "day_of_week": "Monday",
          "start_time": "09:00:00",
          "end_time": "17:00:00"
      },
      {
          "day_of_week": "Tuesday",
          "start_time": "09:00:00",
          "end_time": "17:00:00"
      }
  ]
  ```
- **Response**: `200 OK`

#### `GET /api/doctors/{id}/availability`
Get doctor's availability for a specific date. Supports `?date=YYYY-MM-DD`.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK` (List of available time slots)

#### `GET /api/doctors/{id}/leaves`
Get a doctor's leaves.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `POST /api/doctors/{id}/leaves`
Create a leave record for a doctor.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "leave_date": "2024-12-25" // YYYY-MM-DD
  }
  ```
- **Response**: `201 Created`

#### `DELETE /api/doctors/{id}/leaves/{leave_id}`
Delete a leave record for a doctor.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

---

### Departments (Admin Only)

#### `POST /api/departments`
Create a new department.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "department_name": "Cardiology",
      "description": "Heart related treatments" // optional
  }
  ```
- **Response**: `201 Created`

#### `GET /api/departments`
Get a paginated list of departments. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `GET /api/departments/{id}`
Get a specific department by ID.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

#### `PUT /api/departments/{id}`
Update department details.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "department_name": "Cardiology",
      "description": "Heart related treatments and surgeries" // optional
  }
  ```
- **Response**: `200 OK`

#### `DELETE /api/departments/{id}`
Delete a department.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

---

### Medicines

#### `POST /api/medicines`
Add a new medicine to the catalog.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "medicine_name": "Aspirin",
      "category": "Painkiller",       // optional
      "info_link": "https://link.to"  // optional
  }
  ```
- **Response**: `201 Created`

#### `GET /api/medicines`
Get a paginated list of medicines. Supports `?search` for wildcard search, `?limit`, and `?offset`.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK`

#### `GET /api/medicines/{id}`
Get a specific medicine by ID.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK`

#### `PUT /api/medicines/{id}`
Update medicine details.
- **Auth Required**: Yes (Admin)
- **Request Body**:
  ```json
  {
      "medicine_name": "Aspirin 500mg",
      "category": "Painkiller",       // optional
      "info_link": "https://link.to"  // optional
  }
  ```
- **Response**: `200 OK`

#### `DELETE /api/medicines/{id}`
Delete a medicine from the catalog.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

---

### Patients

#### `GET /api/patients/me`
Get the current logged-in patient's profile.
- **Auth Required**: Yes (Patient)
- **Response**: `200 OK`

#### `PUT /api/patients/me`
Update the current logged-in patient's profile.
- **Auth Required**: Yes (Patient)
- **Request Body**: Same as `PUT /api/patients/{id}`
- **Response**: `200 OK`

#### `GET /api/patients`
Get a paginated list of patients. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Receptionist, Doctor, Admin)
- **Response**: `200 OK`

#### `GET /api/patients/{id}`
Get a specific patient by ID.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK`

#### `PUT /api/patients/{id}`
Update patient details.
- **Auth Required**: Yes (Patient, Admin)
- **Request Body**:
  ```json
  {
      "first_name": "John",       // optional
      "last_name": "Doe",         // optional
      "phone": "1234567890",      // optional
      "address": "123 Main St"    // optional
  }
  ```
- **Response**: `200 OK`

---

### Appointments

#### `POST /api/appointments`
Book a new appointment.
- **Auth Required**: Yes (Patient)
- **Request Body**:
  ```json
  {
      "doctor_id": 1,
      "appointment_date": "2024-05-20", // YYYY-MM-DD
      "type": "new"                     // "new", "follow-up", or "report"
  }
  ```
- **Response**: `201 Created`

#### `GET /api/appointments`
Get a paginated list of appointments. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK`

#### `GET /api/appointments/{id}`
Get a specific appointment by ID.
- **Auth Required**: Yes (Patient, Doctor, Receptionist, Admin)
- **Response**: `200 OK`

#### `PUT /api/appointments/{id}/cancel`
Cancel an appointment.
- **Auth Required**: Yes (Patient, Receptionist, Admin)
- **Response**: `200 OK`

#### `PATCH /api/appointments/{id}/status`
Update the status of an appointment.
- **Auth Required**: Yes (Doctor, Receptionist)
- **Request Body**:
  ```json
  {
      "status": "completed" // "completed", "cancelled", or "no_show"
  }
  ```
- **Response**: `200 OK`

---

### Medical Records

#### `POST /api/medical-records`
Create a new medical record for a patient.
- **Auth Required**: Yes (Doctor)
- **Request Body**:
  ```json
  {
      "patient_id": 1,
      "appointment_id": 1,      // optional
      "diagnosis": "Flu",       // optional
      "treatment": "Rest",      // optional
      "notes": "Patient is recovering well." // optional
  }
  ```
- **Response**: `201 Created`

#### `GET /api/medical-records`
Get a paginated list of medical records. Supports `?patient_id`, `?limit`, and `?offset`.
- **Auth Required**: Yes (Patient, Doctor, Admin)
- **Response**: `200 OK`

#### `GET /api/medical-records/{id}`
Get a specific medical record by ID.
- **Auth Required**: Yes (Patient, Doctor, Admin)
- **Response**: `200 OK`

---

### Medical Tests

#### `POST /api/medical-tests`
Order a new medical test.
- **Auth Required**: Yes (Doctor)
- **Request Body**:
  ```json
  {
      "record_id": 1,
      "test_name": "Blood Count",
      "test_date": "2024-05-20",  // optional
      "notes": "Fasting required" // optional
  }
  ```
- **Response**: `201 Created`

#### `GET /api/medical-tests`
Get a paginated list of medical tests. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Patient, Doctor, Lab Tech, Admin)
- **Response**: `200 OK`

#### `GET /api/medical-tests/{id}`
Get a specific medical test by ID.
- **Auth Required**: Yes (Patient, Doctor, Lab Tech, Admin)
- **Response**: `200 OK`

#### `PUT /api/medical-tests/{id}`
Update medical test results.
- **Auth Required**: Yes (Lab Tech)
- **Request Body**:
  ```json
  {
      "result_data": "Normal", // optional
      "test_date": "2024-05-20" // optional
  }
  ```
- **Response**: `200 OK`

---

### Prescriptions

#### `POST /api/prescriptions`
Create a new prescription.
- **Auth Required**: Yes (Doctor)
- **Request Body**:
  ```json
  {
      "record_id": 1,
      "medicine_id": 1,
      "dosage": "1 tablet",
      "frequency": "Twice a day",
      "duration_days": 7,          // optional
      "notes": "Take after meals"  // optional
  }
  ```
- **Response**: `201 Created`

#### `GET /api/prescriptions`
Get a paginated list of prescriptions. Supports `?limit` and `?offset`.
- **Auth Required**: Yes (Patient, Doctor, Admin)
- **Response**: `200 OK`

#### `GET /api/prescriptions/{id}`
Get a specific prescription by ID.
- **Auth Required**: Yes (Patient, Doctor, Admin)
- **Response**: `200 OK`

---

### Admin

#### `GET /api/admin/audit-logs`
Get audit logs. Supports `?table`, `?action`, `?user_id`, `?cursor`, and `?limit`.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK` (Cursor paginated)

#### `GET /api/admin/audit-logs/{id}`
Get a specific audit log by ID.
- **Auth Required**: Yes (Admin)
- **Response**: `200 OK`

---
## Maintenance Notes
**Refresh Tokens:** The application tracks issued refresh tokens in the `Refresh_Tokens` table for stateful rotation and revocation. Over time, expired tokens will accumulate. It is recommended to occasionally run a cleanup job to delete expired rows:
```sql
DELETE FROM Refresh_Tokens WHERE expires_at < NOW();
```
