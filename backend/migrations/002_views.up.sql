-- =====================================================================
-- 002_views.sql
-- Read-side views used by handlers for reporting / dashboard endpoints
-- =====================================================================

-- ---------------------------------------------------------------------
-- Patient full history: one row per patient with aggregated counts
-- Used by: GET /patients/{id}/summary
-- ---------------------------------------------------------------------
CREATE VIEW patient_summary_view AS
SELECT
    p.patient_id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.blood_type,
    COALESCE(a.total, 0) AS total_appointments,
    COALESCE(mr.total, 0) AS total_medical_records,
    COALESCE(t.total, 0) AS total_tests
FROM Patients p
LEFT JOIN LATERAL (
    SELECT COUNT(*) as total FROM Appointments WHERE patient_id = p.patient_id
) a ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) as total FROM Medical_Records WHERE patient_id = p.patient_id
) mr ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) as total FROM Medical_Tests WHERE patient_id = p.patient_id
) t ON true;

-- ---------------------------------------------------------------------
-- Doctor daily schedule: appointments joined with patient info
-- Used by: GET /doctors/{id}/schedule?date=YYYY-MM-DD
-- ---------------------------------------------------------------------
CREATE VIEW doctor_schedule_view AS
SELECT
    a.appointment_id,
    d.doctor_id,
    e.first_name  AS doctor_first_name,
    e.last_name   AS doctor_last_name,
    a.appointment_date,
    a.serial_number,
    a.status,
    p.patient_id,
    p.first_name  AS patient_first_name,
    p.last_name   AS patient_last_name
FROM Appointments a
JOIN Doctors d     ON d.doctor_id = a.doctor_id
JOIN Employees e   ON e.employee_id = d.employee_id
JOIN Patients p    ON p.patient_id = a.patient_id;



-- ---------------------------------------------------------------------
-- Completed tests with the performing lab-tech identified
-- Used by: GET /tests/{id}, GET /patients/{id}/tests
-- ---------------------------------------------------------------------
CREATE VIEW test_detail_view AS
SELECT
    t.test_id,
    t.test_name,
    t.test_details,
    t.status,
    t.result,
    t.ordered_date,
    t.completed_date,
    p.patient_id,
    p.first_name  AS patient_first_name,
    p.last_name   AS patient_last_name,
    doc_e.first_name AS ordering_doctor_first_name,
    doc_e.last_name  AS ordering_doctor_last_name,
    tech.first_name  AS performed_by_first_name,
    tech.last_name   AS performed_by_last_name
FROM Medical_Tests t
JOIN Patients p         ON p.patient_id = t.patient_id
JOIN Doctors doc         ON doc.doctor_id = t.doctor_id
JOIN Employees doc_e     ON doc_e.employee_id = doc.employee_id
LEFT JOIN Employees tech ON tech.employee_id = t.performed_by;

-- ---------------------------------------------------------------------
-- Prescription detail: header + items joined, for display/printing
-- Used by: GET /prescriptions/{id}
-- ---------------------------------------------------------------------
CREATE VIEW prescription_detail_view AS
SELECT
    pr.prescription_id,
    pr.appointment_id,
    pr.prescription_date,
    pr.instructions,
    e.first_name AS doctor_first_name,
    e.last_name  AS doctor_last_name,
    mr.patient_id,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    mr.record_id,
    mr.record_date,
    mr.diagnosis,
    mr.treatment,
    pi.prescription_item_id,
    m.medicine_name,
    m.info_link AS medicine_info_link,
    pi.dosage,
    pi.quantity,
    pi.duration_days
FROM Prescriptions pr
JOIN Doctors doc           ON doc.doctor_id = pr.doctor_id
JOIN Employees e           ON e.employee_id = doc.employee_id
JOIN Medical_Records mr    ON mr.record_id = pr.record_id
JOIN Patients p            ON p.patient_id = mr.patient_id
LEFT JOIN Prescription_Items pi ON pi.prescription_id = pr.prescription_id
LEFT JOIN Medicines m            ON m.medicine_id = pi.medicine_id;
