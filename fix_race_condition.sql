-- Fix race condition bằng cách thêm advisory lock
-- Chạy script này trong Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_camera_availability_with_lock(
  p_camera_id UUID,
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ,
  p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_total_qty INTEGER;
  v_booked_qty INTEGER;
  v_lock_id BIGINT;
BEGIN
  -- Tạo lock ID từ camera_id để đảm bảo chỉ 1 request xử lý cùng lúc
  v_lock_id := ('x' || substring(p_camera_id::text from 1 for 15))::bit(60)::bigint;
  
  -- Acquire advisory lock (tự động release khi transaction kết thúc)
  PERFORM pg_advisory_xact_lock(v_lock_id);
  
  -- Lấy số lượng máy
  SELECT quantity INTO v_total_qty FROM cameras WHERE id = p_camera_id;
  
  -- Đếm số máy đã được book trong khoảng thời gian
  SELECT COALESCE(SUM(bi.quantity), 0) INTO v_booked_qty
  FROM booking_items bi
  JOIN bookings b ON bi.booking_id = b.id
  WHERE bi.camera_id = p_camera_id
    AND b.payment_status != 'cancelled'
    AND b.pickup_time < p_return_time
    AND b.return_time > p_pickup_time;
  
  RETURN v_total_qty - v_booked_qty;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật function cũ để dùng version có lock
CREATE OR REPLACE FUNCTION check_camera_availability(
  p_camera_id UUID,
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ,
  p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
BEGIN
  RETURN check_camera_availability_with_lock(p_camera_id, p_pickup_time, p_return_time, p_quantity);
END;
$$ LANGUAGE plpgsql;
