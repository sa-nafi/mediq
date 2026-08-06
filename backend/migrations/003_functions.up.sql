-- =====================================================================
-- 003_functions.sql
-- Stored procedures / functions for core business operations
-- =====================================================================

-- ---------------------------------------------------------------------
-- book_appointment
-- Books an appointment after checking the doctor is free at that slot.
-- Called from: POST /appointments
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION book_appointment(
    p_patient_id     INT,
    p_doctor_id      INT,
    p_appointment_date DATE,
    p_type           VARCHAR(20)
) RETURNS INT AS $$
DECLARE
    v_appointment_id INT;
BEGIN
    INSERT INTO Appointments (patient_id, doctor_id, appointment_date, type, status)
    VALUES (p_patient_id, p_doctor_id, p_appointment_date, p_type, 'scheduled')
    RETURNING appointment_id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- cancel_appointment
-- Cancels an appointment, but only if it hasn't already happened.
-- Called from: POST /appointments/{id}/cancel
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id INT) RETURNS VOID AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status FROM Appointments WHERE appointment_id = p_appointment_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Appointment % not found', p_appointment_id;
    END IF;

    IF v_status <> 'scheduled' THEN
        RAISE EXCEPTION 'Cannot cancel appointment % with status %', p_appointment_id, v_status;
    END IF;

    UPDATE Appointments SET status = 'cancelled' WHERE appointment_id = p_appointment_id;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- create_prescription_with_items
-- Creates a prescription header + its line items atomically, taking
-- the items as JSON so Go can pass one call for the whole prescription.
-- Called from: POST /prescriptions
--
-- p_items example:
-- '[{"medicine_id":1,"dosage":"500mg twice daily","quantity":10,"duration_days":5}]'
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_prescription_with_items(
    p_record_id      INT,
    p_doctor_id      INT,
    p_appointment_id INT,
    p_instructions   TEXT,
    p_items          JSONB
) RETURNS INT AS $$
DECLARE
    v_prescription_id INT;
    v_item JSONB;
BEGIN
    INSERT INTO Prescriptions (record_id, doctor_id, appointment_id, instructions)
    VALUES (p_record_id, p_doctor_id, p_appointment_id, p_instructions)
    RETURNING prescription_id INTO v_prescription_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO Prescription_Items (prescription_id, medicine_id, dosage, quantity, duration_days)
        VALUES (
            v_prescription_id,
            (v_item->>'medicine_id')::INT,
            v_item->>'dosage',
            (v_item->>'quantity')::INT,
            (v_item->>'duration_days')::INT
        );
    END LOOP;

    RETURN v_prescription_id;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- complete_test
-- Marks a test completed, records the result, and identifies which
-- employee (expected to be a lab_tech) performed it. The app layer is
-- responsible for verifying p_performed_by actually has role='lab_tech'
-- before calling this — the FK alone doesn't enforce that.
-- Called from: POST /tests/{id}/complete
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_test(
    p_test_id       INT,
    p_result        TEXT,
    p_performed_by  INT
) RETURNS VOID AS $$
BEGIN
    UPDATE Medical_Tests
    SET status = 'completed',
        result = p_result,
        performed_by = p_performed_by,
        completed_date = CURRENT_DATE
    WHERE test_id = p_test_id
      AND status IN ('ordered', 'in_progress');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test % not found or already completed/cancelled', p_test_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- assign_appointment_serial
-- Calculates the serial number and checks schedule/leave before insert
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_appointment_serial() RETURNS TRIGGER AS $$
DECLARE
    v_max_patients INT;
    v_current_serial INT;
BEGIN
    -- 1. Check if the doctor is on leave
    IF EXISTS (
        SELECT 1 FROM Doctor_Leaves 
        WHERE doctor_id = NEW.doctor_id 
          AND leave_date = NEW.appointment_date
    ) THEN
        RAISE EXCEPTION 'Doctor is on leave on this date';
    END IF;

    -- 2. Check schedule and capacity
    -- EXTRACT(DOW FROM date) returns 0-6 (0=Sunday)
    SELECT max_patients INTO v_max_patients
    FROM Doctor_Schedules
    WHERE doctor_id = NEW.doctor_id
      AND day_of_week = EXTRACT(DOW FROM NEW.appointment_date)::INT
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Doctor does not consult on this day of the week';
    END IF;

    -- 3. Calculate next serial number
    -- We can just count existing appointments for that doctor on that date
    SELECT COALESCE(MAX(serial_number), 0) INTO v_current_serial
    FROM Appointments
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date;

    IF v_current_serial >= v_max_patients THEN
        RAISE EXCEPTION 'Patient limit reached for this day';
    END IF;

    NEW.serial_number := v_current_serial + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
