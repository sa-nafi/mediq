-- =====================================================================
-- 004_triggers.sql
-- Generic audit-log trigger, applied to every table except Audit_Log
-- itself.
-- =====================================================================

-- ---------------------------------------------------------------------
-- audit_trigger_func
-- Generic function reused by every audited table. Reads the acting
-- user from a session variable the Go app sets per-request/transaction:
--
--   SET LOCAL app.current_user_id = '<user_id>';
--
-- If unset (e.g. seed scripts, migrations), changed_by is NULL.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
    v_record_id INT;
BEGIN
    -- current_setting(..., true) returns NULL instead of raising if unset
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT;

    IF TG_OP = 'DELETE' THEN
        v_record_id := (to_jsonb(OLD)->>(TG_ARGV[0]))::INT;
        INSERT INTO Audit_Log(table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, to_jsonb(OLD), NULL, v_user_id);
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := (to_jsonb(NEW)->>(TG_ARGV[0]))::INT;
        INSERT INTO Audit_Log(table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), v_user_id);
        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := (to_jsonb(NEW)->>(TG_ARGV[0]))::INT;
        INSERT INTO Audit_Log(table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, NULL, to_jsonb(NEW), v_user_id);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Attach the generic audit trigger to every table except Audit_Log
-- itself (auditing the audit log would be a pointless infinite trap).
-- TG_ARGV[0] tells the function which column is that table's PK.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON Users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('user_id');

CREATE TRIGGER trg_audit_departments
    AFTER INSERT OR UPDATE OR DELETE ON Departments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('department_id');

CREATE TRIGGER trg_audit_employees
    AFTER INSERT OR UPDATE OR DELETE ON Employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('employee_id');

CREATE TRIGGER trg_audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON Patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('patient_id');

CREATE TRIGGER trg_audit_doctors
    AFTER INSERT OR UPDATE OR DELETE ON Doctors
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('doctor_id');

CREATE TRIGGER trg_audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON Appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('appointment_id');

CREATE TRIGGER trg_audit_medical_records
    AFTER INSERT OR UPDATE OR DELETE ON Medical_Records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('record_id');

CREATE TRIGGER trg_audit_tests
    AFTER INSERT OR UPDATE OR DELETE ON Medical_Tests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('test_id');

CREATE TRIGGER trg_audit_medicines
    AFTER INSERT OR UPDATE OR DELETE ON Medicines
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('medicine_id');

CREATE TRIGGER trg_audit_prescriptions
    AFTER INSERT OR UPDATE OR DELETE ON Prescriptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('prescription_id');

CREATE TRIGGER trg_audit_prescription_items
    AFTER INSERT OR UPDATE OR DELETE ON Prescription_Items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('prescription_item_id');
