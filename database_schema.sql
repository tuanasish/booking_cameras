-- ============================================
-- KANTRA CAMERA BOOKING SYSTEM - DATABASE SCHEMA
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================

-- Bảng cấu hình hệ thống
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_fee_per_km INTEGER DEFAULT 8000,
  default_deposit INTEGER DEFAULT 50000,
  late_fee_divisor INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chèn cấu hình mặc định
INSERT INTO settings (delivery_fee_per_km, default_deposit, late_fee_divisor) 
VALUES (8000, 50000, 5);

-- Bảng máy ảnh
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  model_line VARCHAR(50),
  price_6h INTEGER NOT NULL,
  price_12h INTEGER,
  price_24h INTEGER,
  price_additional_day INTEGER,
  quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng phụ kiện
CREATE TABLE accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('tripod', 'reflector', 'other')),
  name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Bảng admin
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chèn admin mặc định (username: admin, password: admin123)
-- Lưu ý: Trong production, password nên được hash bằng bcrypt
INSERT INTO admins (username, password_hash, name) 
VALUES ('admin', 'admin123', 'Quản lý');

-- Bảng nhân viên
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng khách hàng
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  platforms VARCHAR(10)[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng booking chính
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  created_by UUID REFERENCES employees(id),
  
  pickup_time TIMESTAMPTZ NOT NULL,
  return_time TIMESTAMPTZ NOT NULL,
  
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposited', 'paid', 'cancelled')),
  deposit_type VARCHAR(20) DEFAULT 'none' CHECK (deposit_type IN ('none', 'default', 'custom', 'cccd', 'vneid')),
  deposit_amount INTEGER DEFAULT 0,
  cccd_name VARCHAR(100),
  has_vneid BOOLEAN DEFAULT false,
  
  total_rental_fee INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  discount_reason VARCHAR(50),
  final_fee INTEGER DEFAULT 0,
  late_fee INTEGER DEFAULT 0,
  total_delivery_fee INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng máy thuê trong booking
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  camera_id UUID REFERENCES cameras(id),
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- Bảng phụ kiện trong booking
CREATE TABLE booking_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  accessory_type VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  note TEXT
);

-- Bảng task (pickup/return)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('pickup', 'return')),
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  staff_id UUID REFERENCES employees(id),
  location TEXT,
  delivery_fee INTEGER DEFAULT 0
);

-- Bảng khôi phục thẻ nhớ
CREATE TABLE recovery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  memory_card_code VARCHAR(50),
  need_recovery BOOLEAN DEFAULT false,
  need_upload BOOLEAN DEFAULT false,
  is_recovered BOOLEAN DEFAULT false,
  is_uploaded BOOLEAN DEFAULT false,
  is_link_sent BOOLEAN DEFAULT false,
  no_error_24h BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Function kiểm tra máy còn trống
CREATE OR REPLACE FUNCTION check_camera_availability(
  p_camera_id UUID,
  p_pickup_time TIMESTAMPTZ,
  p_return_time TIMESTAMPTZ,
  p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_total_qty INTEGER;
  v_booked_qty INTEGER;
BEGIN
  SELECT quantity INTO v_total_qty FROM cameras WHERE id = p_camera_id;
  
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

-- Function lấy danh sách máy trống theo thời gian
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
    ), 0) AS available_qty
  FROM cameras c
  WHERE c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_tasks ENABLE ROW LEVEL SECURITY;

-- Tạm thời cho phép tất cả (sẽ config RLS sau)
CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all" ON cameras FOR ALL USING (true);
CREATE POLICY "Allow all" ON accessories FOR ALL USING (true);
CREATE POLICY "Allow all" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all" ON booking_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON booking_accessories FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all" ON recovery_tasks FOR ALL USING (true);

-- Thêm dữ liệu mẫu cho máy ảnh
INSERT INTO cameras (name, model_line, price_6h, price_12h, price_24h, quantity) VALUES
('Canon M10', 'Canon M', 500000, 650000, 800000, 1),
('Canon M100', 'Canon M', 550000, 700000, 850000, 2),
('Canon R50', 'Canon R', 800000, 950000, 1100000, 1);

-- Thêm phụ kiện mẫu
INSERT INTO accessories (type, name, quantity, price) VALUES
('tripod', 'Tripod Basic', 3, 50000),
('reflector', 'Hắt sáng 5 in 1', 2, 30000);

SELECT 'Database schema created successfully!' AS status;
