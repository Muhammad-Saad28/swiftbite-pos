-- ========================================================
-- SwiftBite POS - Add Cost Per Unit to Inventory Tables
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste & Run
-- ========================================================

-- 1. Add cost_per_unit column to the inventory table
ALTER TABLE IF EXISTS inventory 
ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10, 2) DEFAULT 0;

-- 2. Add cost_per_unit column to inventory_transactions table
ALTER TABLE IF EXISTS inventory_transactions 
ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10, 2) DEFAULT 0;

-- 3. Notify schema cache to reload immediately
NOTIFY pgrst, 'reload schema';
