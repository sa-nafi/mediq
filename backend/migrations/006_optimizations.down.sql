-- =====================================================================
-- 006_optimizations.down.sql
-- Revert database index optimizations
-- =====================================================================

DROP INDEX IF EXISTS idx_medicines_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_prescription_items_medicine;
