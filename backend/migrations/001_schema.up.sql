-- =====================================================================
-- 001_schema.sql
-- Diagnostic Center Management System — Core Schema
-- =====================================================================

-- ---------------------------------------------------------------------
-- USERS  (single login table for all 5 roles)
-- ---------------------------------------------------------------------
CREATE TABLE Users (
    user_id         SERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL
                       CHECK (role IN ('patient','doctor','lab_tech','receptionist','admin')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- DEPARTMENTS
-- ---------------------------------------------------------------------
CREATE TABLE Departments (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT
);

-- ---------------------------------------------------------------------
-- EMPLOYEES
-- Common profile for any staff member (doctor, lab_tech, receptionist,
-- admin). Doctors extend this via employee_id. lab_tech and
-- receptionist have no extra table — they're plain Employees rows,
-- distinguished only by their Users.role.
-- ---------------------------------------------------------------------
CREATE TABLE Employees (
    employee_id     SERIAL PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    department_id   INT REFERENCES Departments(department_id) ON DELETE SET NULL,
    first_name      VARCHAR(60) NOT NULL,
    last_name       VARCHAR(60) NOT NULL,
    phone           VARCHAR(20),
    hire_date       DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ---------------------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------------------
CREATE TABLE Patients (
    patient_id      SERIAL PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    first_name      VARCHAR(60) NOT NULL,
    last_name       VARCHAR(60) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10),
    blood_type      VARCHAR(5),
    phone           VARCHAR(20),
    address         TEXT
);

-- ---------------------------------------------------------------------
-- DOCTORS
-- ---------------------------------------------------------------------
CREATE TABLE Doctors (
    doctor_id           SERIAL PRIMARY KEY,
    employee_id         INT NOT NULL UNIQUE REFERENCES Employees(employee_id) ON DELETE CASCADE,
    specialization      VARCHAR(100),
    license_number      VARCHAR(50) NOT NULL UNIQUE,
    consultation_fee    DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0)
);

-- ---------------------------------------------------------------------
-- DOCTOR_SCHEDULES
-- ---------------------------------------------------------------------
CREATE TABLE Doctor_Schedules (
    schedule_id     SERIAL PRIMARY KEY,
    doctor_id       INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE CASCADE,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    max_patients    INT NOT NULL CHECK (max_patients > 0),
    UNIQUE (doctor_id, day_of_week)
);

-- ---------------------------------------------------------------------
-- DOCTOR_LEAVES
-- ---------------------------------------------------------------------
CREATE TABLE Doctor_Leaves (
    leave_id        SERIAL PRIMARY KEY,
    doctor_id       INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE CASCADE,
    leave_date      DATE NOT NULL,
    UNIQUE (doctor_id, leave_date)
);

-- ---------------------------------------------------------------------
-- APPOINTMENTS
-- (No room tracking — receptionist handles room assignment verbally,
-- outside the system.)
-- ---------------------------------------------------------------------
CREATE TABLE Appointments (
    appointment_id      SERIAL PRIMARY KEY,
    patient_id          INT NOT NULL REFERENCES Patients(patient_id) ON DELETE CASCADE,
    doctor_id           INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE RESTRICT,
    appointment_date    DATE NOT NULL,
    serial_number       INT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                           CHECK (status IN ('scheduled','completed','cancelled','no_show')),
    reason              TEXT,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    -- a doctor cannot have two appointments with the same serial on the same date
    UNIQUE (doctor_id, appointment_date, serial_number)
);

-- ---------------------------------------------------------------------
-- MEDICAL_RECORDS
-- ---------------------------------------------------------------------
CREATE TABLE Medical_Records (
    record_id       SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES Patients(patient_id) ON DELETE CASCADE,
    doctor_id       INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES Appointments(appointment_id) ON DELETE SET NULL,
    record_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT
);

-- ---------------------------------------------------------------------
-- MEDICAL_TESTS  (diagnostic test orders + results)
-- doctor_id = who ordered it. performed_by = which employee (lab_tech)
-- actually carried it out and entered the result. performed_by FKs to
-- Employees directly, since lab_tech has no dedicated table; the
-- app layer is responsible for checking that employee's role is
-- actually 'lab_tech' before allowing them to complete a test.
-- ---------------------------------------------------------------------
CREATE TABLE Medical_Tests (
    test_id         SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES Patients(patient_id) ON DELETE CASCADE,
    doctor_id       INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES Appointments(appointment_id) ON DELETE SET NULL,
    performed_by    INT REFERENCES Employees(employee_id) ON DELETE SET NULL,
    test_name       VARCHAR(150) NOT NULL,
    test_type       VARCHAR(50),      -- e.g. 'Blood', 'Imaging', 'Urine'
    status          VARCHAR(20) NOT NULL DEFAULT 'ordered'
                       CHECK (status IN ('ordered','in_progress','completed','cancelled')),
    result          TEXT,
    price           DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    ordered_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_date  DATE
);

-- ---------------------------------------------------------------------
-- MEDICINES
-- Pure reference catalog — a diagnostic center doesn't dispense or
-- stock medicine like a pharmacy. Exists only so Prescription_Items
-- has a consistent, structured drug to point at (instead of free text).
-- ---------------------------------------------------------------------
CREATE TABLE Medicines (
    medicine_id     SERIAL PRIMARY KEY,
    medicine_name   VARCHAR(150) NOT NULL,
    category        VARCHAR(80),
    info_link       VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- PRESCRIPTIONS  (header)
-- ---------------------------------------------------------------------
CREATE TABLE Prescriptions (
    prescription_id     SERIAL PRIMARY KEY,
    record_id           INT NOT NULL REFERENCES Medical_Records(record_id) ON DELETE CASCADE,
    doctor_id           INT NOT NULL REFERENCES Doctors(doctor_id) ON DELETE RESTRICT,
    prescription_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    instructions        TEXT
);

-- ---------------------------------------------------------------------
-- PRESCRIPTION_ITEMS  (line items)
-- ---------------------------------------------------------------------
CREATE TABLE Prescription_Items (
    prescription_item_id SERIAL PRIMARY KEY,
    prescription_id      INT NOT NULL REFERENCES Prescriptions(prescription_id) ON DELETE CASCADE,
    medicine_id          INT NOT NULL REFERENCES Medicines(medicine_id) ON DELETE RESTRICT,
    dosage               VARCHAR(100),      -- e.g. '500mg twice daily'
    quantity             INT NOT NULL CHECK (quantity > 0),
    duration_days        INT CHECK (duration_days > 0)
);

-- ---------------------------------------------------------------------
-- AUDIT_LOG  (generic, populated entirely by triggers — see 004_triggers.sql)
-- ---------------------------------------------------------------------
CREATE TABLE Audit_Log (
    audit_id        BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_id       INT NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    changed_by      INT,             -- Users.user_id, nullable if unknown/system
    changed_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- =====================================================================
-- INDEXES (beyond those implied by PK/UNIQUE)
-- =====================================================================
CREATE INDEX idx_appointments_patient      ON Appointments(patient_id);
CREATE INDEX idx_appointments_doctor_date  ON Appointments(doctor_id, appointment_date);
CREATE INDEX idx_doctor_schedules_doc      ON Doctor_Schedules(doctor_id);
CREATE INDEX idx_doctor_leaves_doc         ON Doctor_Leaves(doctor_id);
CREATE INDEX idx_employees_department      ON Employees(department_id);
CREATE INDEX idx_medical_records_patient   ON Medical_Records(patient_id);
CREATE INDEX idx_medical_records_doctor    ON Medical_Records(doctor_id);
CREATE INDEX idx_medical_records_appt      ON Medical_Records(appointment_id);
CREATE INDEX idx_tests_patient             ON Medical_Tests(patient_id);
CREATE INDEX idx_tests_status              ON Medical_Tests(status);
CREATE INDEX idx_tests_performed_by        ON Medical_Tests(performed_by);
CREATE INDEX idx_tests_doctor              ON Medical_Tests(doctor_id);
CREATE INDEX idx_tests_appt                ON Medical_Tests(appointment_id);
CREATE INDEX idx_prescription_items_rx     ON Prescription_Items(prescription_id);
CREATE INDEX idx_prescriptions_record      ON Prescriptions(record_id);
CREATE INDEX idx_prescriptions_doctor      ON Prescriptions(doctor_id);
CREATE INDEX idx_audit_log_table_record    ON Audit_Log(table_name, record_id);
