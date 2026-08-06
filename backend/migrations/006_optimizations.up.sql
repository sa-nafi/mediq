-- =====================================================================
-- 006_optimizations.up.sql
-- Database index optimizations for Mediq
-- =====================================================================

-- 1. Index the foreign key for medicine_id to prevent full table scans 
-- when deleting a medicine (ON DELETE RESTRICT checks).
CREATE INDEX IF NOT EXISTS idx_prescription_items_medicine 
ON Prescription_Items(medicine_id);

-- 2. Enable pg_trgm for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. Create a GIN index on medicine_name using trigram operations
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm 
ON Medicines USING GIN (medicine_name gin_trgm_ops);
