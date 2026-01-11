-- ============================================
-- CAMERA BLOCKS - Block lịch cho máy ảnh
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================

-- Bảng block camera (sửa chữa, chờ hàng, bảo trì...)
CREATE TABLE camera_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('repair', 'pending_delivery', 'maintenance', 'other')),
  note TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Đảm bảo end_time > start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE camera_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON camera_blocks FOR ALL USING (true);

-- Index for performance
CREATE INDEX idx_camera_blocks_camera_id ON camera_blocks(camera_id);
CREATE INDEX idx_camera_blocks_time_range ON camera_blocks(start_time, end_time);

-- Function lấy số lượng đang bị block tại một thời điểm
CREATE OR REPLACE FUNCTION get_blocked_quantity(
  p_camera_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS INTEGER AS $$
DECLARE
  v_blocked_qty INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO v_blocked_qty
  FROM camera_blocks
  WHERE camera_id = p_camera_id
    AND start_time < p_end_time
    AND end_time > p_start_time;
  
  RETURN v_blocked_qty;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật function check_camera_availability để include blocks
CREATE OR REPLACE FUNCTION check_camera_availability(
  p_camera_id UUID,
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ,
  p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_total_qty INTEGER;
  v_booked_qty INTEGER;
  v_blocked_qty INTEGER;
BEGIN
  -- Lấy tổng số máy
  SELECT quantity INTO v_total_qty FROM cameras WHERE id = p_camera_id;
  
  -- Số máy đang được booking
  SELECT COALESCE(SUM(bi.quantity), 0) INTO v_booked_qty
  FROM booking_items bi
  JOIN bookings b ON bi.booking_id = b.id
  WHERE bi.camera_id = p_camera_id
    AND b.payment_status != 'cancelled'
    AND b.pickup_time < p_return_time
    AND b.return_time > p_pickup_time;
  
  -- Số máy đang bị block
  SELECT COALESCE(SUM(quantity), 0) INTO v_blocked_qty
  FROM camera_blocks
  WHERE camera_id = p_camera_id
    AND start_time < p_return_time
    AND end_time > p_pickup_time;
  
  RETURN v_total_qty - v_booked_qty - v_blocked_qty;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật function get_available_cameras để include blocks
CREATE OR REPLACE FUNCTION get_available_cameras(
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ
) RETURNS TABLE (
  camera_id UUID,
  name VARCHAR,
  model_line VARCHAR,
  price_6h INTEGER,
  total_qty INTEGER,
  available_qty INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.model_line,
    c.price_6h,
    c.quantity AS total_qty,
    c.quantity - COALESCE((
      SELECT SUM(bi.quantity)::INTEGER
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.camera_id = c.id
        AND b.payment_status != 'cancelled'
        AND b.pickup_time < p_return_time
        AND b.return_time > p_pickup_time
    ), 0) - COALESCE((
      SELECT SUM(cb.quantity)::INTEGER
      FROM camera_blocks cb
      WHERE cb.camera_id = c.id
        AND cb.start_time < p_return_time
        AND cb.end_time > p_pickup_time
    ), 0) AS available_qty
  FROM cameras c
  WHERE c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function lấy realtime availability (tại thời điểm hiện tại)
CREATE OR REPLACE FUNCTION get_realtime_camera_availability()
RETURNS TABLE (
  camera_id UUID,
  camera_name VARCHAR,
  model_line VARCHAR,
  total_qty INTEGER,
  booked_qty INTEGER,
  blocked_qty INTEGER,
  available_qty INTEGER
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.model_line,
    c.quantity AS total_qty,
    COALESCE((
      SELECT SUM(bi.quantity)::INTEGER
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.camera_id = c.id
        AND b.payment_status != 'cancelled'
        AND b.pickup_time <= v_now
        AND b.return_time > v_now
    ), 0) AS booked_qty,
    COALESCE((
      SELECT SUM(cb.quantity)::INTEGER
      FROM camera_blocks cb
      WHERE cb.camera_id = c.id
        AND cb.start_time <= v_now
        AND cb.end_time > v_now
    ), 0) AS blocked_qty,
    c.quantity - COALESCE((
      SELECT SUM(bi.quantity)::INTEGER
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.camera_id = c.id
        AND b.payment_status != 'cancelled'
        AND b.pickup_time <= v_now
        AND b.return_time > v_now
    ), 0) - COALESCE((
      SELECT SUM(cb.quantity)::INTEGER
      FROM camera_blocks cb
      WHERE cb.camera_id = c.id
        AND cb.start_time <= v_now
        AND cb.end_time > v_now
    ), 0) AS available_qty
  FROM cameras c
  WHERE c.is_active = true
  ORDER BY c.model_line, c.name;
END;
$$ LANGUAGE plpgsql;

SELECT 'Camera blocks table and functions created successfully!' AS status;
