# Backend Guide - Diagnostic Center Management System

University DBMS lab course project. This document is the single source of
truth for the project's backend design decisions. Use it as context when writing
backend code.

## Tech Stack

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

## Roles (5)

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

## Database Schema (12 tables)

All tables and relationships, as actually defined in `001_schema.sql`:

```
Users (user_id PK, email, password_hash, role, is_active, created_at)
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

Appointments (appointment_id PK, patient_id FK→Patients, doctor_id FK→Doctors,
              appointment_date, appointment_time, status, reason, notes, created_at)
  status CHECK IN ('scheduled','completed','cancelled','no_show')
  UNIQUE (doctor_id, appointment_date, appointment_time)  -- no double-booking

Medical_Records (record_id PK, patient_id FK→Patients, doctor_id FK→Doctors,
                  appointment_id FK→Appointments NULLABLE, record_date,
                  diagnosis, treatment, notes)

Medical_Tests (test_id PK, patient_id FK→Patients, doctor_id FK→Doctors [ordered by],
       appointment_id FK→Appointments NULLABLE,
       performed_by FK→Employees NULLABLE [lab_tech who ran it],
       test_name, test_type, status, result, price, ordered_date, completed_date)
  status CHECK IN ('ordered','in_progress','completed','cancelled')
  -- NOTE: performed_by FKs to Employees directly (no LabTech table exists).
  -- App layer MUST verify that employee's Users.role = 'lab_tech' before
  -- allowing them to complete a test — the FK alone doesn't enforce this.

Medicines (medicine_id PK, medicine_name, category)
  -- PURE REFERENCE CATALOG. No stock_quantity, no unit_price, no expiry.
  -- Exists only so Prescription_Items has a consistent drug to point at.

Prescriptions (prescription_id PK, record_id FK→Medical_Records,
                doctor_id FK→Doctors, prescription_date, instructions)

Prescription_Items (prescription_item_id PK, prescription_id FK→Prescriptions,
                     medicine_id FK→Medicines, dosage, quantity, duration_days)

Audit_Log (audit_id PK, table_name, record_id, action, old_data JSONB,
           new_data JSONB, changed_by, changed_at)
  action CHECK IN ('INSERT','UPDATE','DELETE')
  -- Populated ENTIRELY by triggers. Never written to directly by app code.
```

### Key relationship chains worth understanding

- `Users` → `Patients` (patient self-registration: 2-table insert)
- `Users` → `Employees` → `Doctors` (admin creates doctor: 3-table insert)
- `Users` → `Employees` (admin creates lab_tech/receptionist: 2-table insert,
  no 3rd table — role alone distinguishes them)
- `Medical_Records` → `Prescriptions` → `Prescription_Items` (a prescription
  is justified by a diagnosis, so it FKs to the record, not the appointment)
- `Medical_Tests.doctor_id` (who ordered) vs `Medical_Tests.performed_by` (who ran it) are
  two distinct FKs — don't conflate them

## Views (`002_views.sql`)

Read-side, used directly by repo functions instead of inline joins:

| View | Purpose |
|---|---|
| `patient_summary_view` | Per-patient aggregate counts (appointments, records, tests) |
| `doctor_schedule_view` | Doctor's appointments joined with patient info |
| `pending_tests_view` | Medical tests with status ordered/in_progress, for lab-tech queue |
| `test_detail_view` | Full test detail including ordering doctor + performing lab-tech |
| `prescription_detail_view` | Prescription header + line items + doctor name, joined |

## Stored Procedures/Functions (`003_functions.sql`)

Business logic lives here, not in Go — repo layer calls these:

| Function | Purpose |
|---|---|
| `book_appointment(...)` | Inserts appointment; raises exception if doctor already booked at that date+time |
| `cancel_appointment(id)` | Cancels only if status is still `scheduled`; raises otherwise |
| `create_prescription_with_items(record_id, doctor_id, instructions, items JSONB)` | Atomic header + N line-item insert from one JSON payload |
| `complete_test(test_id, result, performed_by)` | Sets status=completed, result, performed_by, completed_date; raises if already completed/cancelled |

## Triggers (`004_triggers.sql`)

One generic function, `audit_trigger_func()`, attached via `AFTER INSERT OR
UPDATE OR DELETE` to **every table except `Audit_Log` itself** — 11
triggers total, one each on: Users, Departments, Employees, Patients,
Doctors, Appointments, Medical_Records, Medical_Tests, Medicines, Prescriptions,
Prescription_Items.

**How `changed_by` gets populated**: the trigger reads a Postgres session
variable, `current_setting('app.current_user_id', true)`. This is NULL
unless something sets it first. **The Go app must run `SET LOCAL
app.current_user_id = '<user_id>'` at the start of every request's DB
transaction** — this is `internal/middleware/transaction.go`'s job (see
below). Without that middleware, every audit entry will have `changed_by
= NULL`.

No other triggers exist. (Stock-deduction trigger was designed then
removed along with the logistics/stock decision — do not re-add.)

## Go Backend File Structure

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
│   │   ├── test.go
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
│   │   ├── test.go                # calls complete_test(); MUST verify performed_by role='lab_tech'
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
│   │   ├── test.go                # doctor orders, lab_tech completes
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

### Layer responsibilities (strict separation)

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

### Two-/three-table inserts to remember when implementing registration

- Patient self-register: `Users` → `Patients` (handled in `handlers/auth.go`)
- Admin creates doctor: `Users` → `Employees` → `Doctors` (in `handlers/doctor.go` or `employee.go`, admin-only)
- Admin creates lab_tech/receptionist: `Users` → `Employees` only (in `handlers/employee.go`, admin-only)

All of these should happen inside the transaction that `middleware/
transaction.go` already opens per-request, so the audit trigger correctly
attributes the inserts to the acting admin/patient.

## Bootstrapping

Since only patients can self-register, the database starts with **zero
admins**. First admin must be created via a one-off seed script (SQL
insert or a Go `--seed-admin` flag), run manually outside normal API
flow — not exposed as a route.
