-- ============================================
-- RESET ALL TEST DATA FOR PRODUCTION
-- Tác giả: Antigravity AI
-- Ngày: 2026-01-08
-- ============================================
-- CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu!
-- Chỉ chạy khi bạn chắc chắn muốn reset hệ thống.
-- ============================================

-- Bước 1: Xóa dữ liệu theo thứ tự dependency (con trước, cha sau)

-- Xóa các bảng phụ thuộc vào bookings
TRUNCATE TABLE recovery_tasks CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE booking_accessories CASCADE;
TRUNCATE TABLE booking_items CASCADE;

-- Xóa bảng bookings
TRUNCATE TABLE bookings CASCADE;

-- Xóa khách hàng test
TRUNCATE TABLE customers CASCADE;

-- Xóa nhân viên test (giữ lại admin nếu cần)
-- TRUNCATE TABLE employees CASCADE;

-- ============================================
-- Bước 2: Reset sequence IDs (nếu có)
-- ============================================
-- Nếu bạn dùng SERIAL hoặc IDENTITY columns, chúng sẽ tự động reset
-- khi dùng TRUNCATE. Nếu không, hãy chạy lệnh sau:

-- ALTER SEQUENCE bookings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE customers_id_seq RESTART WITH 1;

-- ============================================
-- Bước 3: Xác nhận dữ liệu đã được xóa
-- ============================================
SELECT 'bookings' as table_name, COUNT(*) as record_count FROM bookings
UNION ALL
SELECT 'booking_items', COUNT(*) FROM booking_items
UNION ALL
SELECT 'booking_accessories', COUNT(*) FROM booking_accessories
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'recovery_tasks', COUNT(*) FROM recovery_tasks
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;

-- ============================================
-- GHI CHÚ:
-- - Bảng cameras, accessories, settings, admins, employees
--   KHÔNG bị xóa vì đây là dữ liệu cấu hình.
-- - Nếu muốn xóa cả nhân viên, uncomment dòng TRUNCATE employees.
-- - Chạy script này trong Supabase SQL Editor.
-- ============================================
