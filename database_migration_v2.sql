-- Migration v2: Add price_additional_day to cameras and has_vneid to bookings
-- Run this script in Supabase SQL Editor

-- 1. Add price_additional_day to cameras
ALTER TABLE cameras
ADD COLUMN IF NOT EXISTS price_additional_day INTEGER;

-- Optional: initialize price_additional_day based on existing price_24h
UPDATE cameras
SET price_additional_day = COALESCE(price_additional_day, CAST(price_24h * 0.75 AS INTEGER))
WHERE price_24h IS NOT NULL;

-- 2. Add has_vneid to bookings and extend deposit_type
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS has_vneid BOOLEAN DEFAULT false;

-- NOTE: deposit_type enum is implemented via CHECK constraint in schema,
-- so existing rows do not need migration; new code will start using 'vneid'.



