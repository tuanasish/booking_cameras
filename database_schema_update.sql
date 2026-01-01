-- Migration: Add total_delivery_fee column to bookings table
-- Run this in Supabase SQL Editor if the column doesn't exist

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_delivery_fee INTEGER DEFAULT 0;

-- Update existing bookings to calculate total_delivery_fee from tasks
UPDATE bookings b
SET total_delivery_fee = COALESCE((
  SELECT SUM(delivery_fee)
  FROM tasks t
  WHERE t.booking_id = b.id
), 0);


