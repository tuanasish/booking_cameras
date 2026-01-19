-- Migration: Thêm cột sort_order cho chức năng sắp xếp thứ tự máy ảnh
-- Chạy trong Supabase Dashboard > SQL Editor

-- 1. Thêm cột sort_order
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Cập nhật sort_order cho các camera hiện có theo thứ tự tên
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM cameras
)
UPDATE cameras c SET sort_order = r.rn
FROM ranked r WHERE c.id = r.id;

SELECT 'Migration completed: sort_order column added to cameras table' AS status;
