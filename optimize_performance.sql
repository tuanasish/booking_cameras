-- 1. Indexing for faster lookups and range queries
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_time ON bookings (pickup_time);
CREATE INDEX IF NOT EXISTS idx_bookings_return_time ON bookings (return_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings (payment_status);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_camera_id ON booking_items (camera_id);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);

-- 2. Batch Availability Check RPC
-- This function checks availability for multiple cameras in one call
CREATE OR REPLACE FUNCTION check_multiple_cameras_availability(
  p_items JSONB, -- Array of {camera_id, quantity}
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  camera_id UUID,
  requested_qty INT,
  available_qty INT,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH requested AS (
    SELECT 
      (val->>'camera_id')::UUID as rid,
      (val->>'quantity')::INT as rqty
    FROM jsonb_array_elements(p_items) as val
  ),
  camera_info AS (
    SELECT id, name, quantity FROM cameras WHERE id IN (SELECT rid FROM requested)
  ),
  current_bookings AS (
    SELECT bi.camera_id, SUM(bi.quantity) as booked_qty
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    WHERE b.payment_status != 'cancelled'
      AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
      AND b.pickup_time < p_return_time
      AND b.return_time > p_pickup_time
      AND bi.camera_id IN (SELECT rid FROM requested)
    GROUP BY bi.camera_id
  )
  SELECT 
    r.rid,
    r.rqty,
    COALESCE(c.quantity, 0) - COALESCE(cb.booked_qty, 0) as available_qty,
    (COALESCE(c.quantity, 0) - COALESCE(cb.booked_qty, 0)) >= r.rqty as is_available
  FROM requested r
  LEFT JOIN camera_info c ON r.rid = c.id
  LEFT JOIN current_bookings cb ON r.rid = cb.camera_id;
END;
$$ LANGUAGE plpgsql;
