# 🏥 REVIEW LUỒNG HOẠT ĐỘNG - Camera Booking System
> Ngày review: 05/03/2026

## 📊 Tổng quan

| Flow | Trạng thái | Mức nghiêm trọng |
|------|-----------|-------------------|
| Tạo booking mới | ✅ Ổn | - |
| Chỉnh sửa booking | ⚠️ Có lỗi | 🔴 Cao |
| Hủy booking | ⚠️ Có lỗi | 🟡 Trung bình |
| Khôi phục booking | ⚠️ Có lỗi | 🟡 Trung bình |
| Nhận máy (Pickup) | ⚠️ Có lỗi | 🔴 Cao |
| Trả máy (Return) | ⚠️ Có lỗi | 🟡 Trung bình |
| Hoàn tác nhận máy | ⚠️ Có lỗi | 🔴 Cao |

---

## 🔴 BUG #1: Nhận máy đặt sai trạng thái → "paid" (ĐÃ THANH TOÁN)

**File:** `app/(dashboard)/tasks/pickup/page.tsx` dòng 128-134

**Vấn đề:** Khi nhân viên xác nhận nhận máy, code set `payment_status = 'paid'`. Nhưng lúc này khách **chưa trả tiền**, chỉ mới nhận máy thôi. Trạng thái đúng phải giữ nguyên (`deposited` hoặc `pending`).

**Hậu quả:** Trang Trả máy tính sai vì nghĩ khách đã thanh toán xong. Nếu khách chưa cọc thì hệ thống hiển thị "Đã thanh toán" — sai thực tế.

**Cách sửa:** Bỏ việc update `payment_status` khi nhận máy. Chỉ set `payment_status = 'paid'` khi **trả máy + thanh toán xong**.

```diff
// pickup/page.tsx - handleConfirmPickup
  if (response.ok) {
    const task = tasks.find((t) => t.id === selectedTaskId);
-   if (task) {
-     await fetch(`/api/bookings/${task.booking_id}`, {
-       method: 'PATCH',
-       headers: { 'Content-Type': 'application/json' },
-       body: JSON.stringify({ payment_status: 'paid' }),
-     });
-   }
    fetchTasks();
  }
```

---

## 🔴 BUG #2: Hoàn tác nhận máy không reset trạng thái booking

**File:** `app/(dashboard)/tasks/pickup/page.tsx` dòng 148-178

**Vấn đề:** Khi bấm "Hoàn tác" nhận máy (undo pickup), code chỉ reset task (`completed_at = null, staff_id = null`) nhưng **không reset `payment_status` của booking** về trạng thái trước đó.

**Hậu quả:** Booking vẫn hiển thị "Đã thanh toán" dù đã hoàn tác. Gây nhầm lẫn cho nhân viên.

**Cách sửa:** Nếu sửa Bug #1 (bỏ set `paid` khi pickup), thì bug này tự hết. Nếu không, cần rollback `payment_status` khi undo.

---

## 🔴 BUG #3: Chỉnh sửa booking không cập nhật thiết bị và phụ kiện

**File:** `app/(dashboard)/bookings/[id]/edit/page.tsx` dòng 130-151

**Vấn đề:** Khi chỉnh sửa booking, code chỉ gửi các field cơ bản (thời gian, cọc, giá). **KHÔNG gửi:**
- `booking_items` (danh sách máy thuê) — thêm/bớt máy không được lưu
- `booking_accessories` (phụ kiện) — thêm/bớt tripod/hắt sáng không lưu
- `notes` (ghi chú) — thay đổi ghi chú không lưu
- Task locations/fees — thay đổi địa điểm giao/trả không lưu

**Hậu quả:** Nhân viên sửa thiết bị trên form nhưng bấm lưu thì dữ liệu cũ vẫn giữ nguyên. Rất dễ gây sai lệch đơn.

**Cách sửa:** Backend (`api/bookings/[id]/route.ts`) cần xử lý update `booking_items`, `booking_accessories`, và `tasks`. Frontend cần gửi thêm các field này.

---

## 🟡 BUG #4: API Tasks thiếu trường cho trang Trả máy

**File:** `app/api/tasks/route.ts` dòng 14-27

**Vấn đề:** API tasks chỉ select một số field của booking:
```
payment_status, deposit_type, deposit_amount, cccd_name
```
Nhưng trang Trả máy và `ReturnTaskModal` cần thêm:
- `pickup_time`, `return_time`, `final_fee`, `late_fee`, `total_delivery_fee`

**Hậu quả:** Trang trả máy có thể hiển thị sai hoặc thiếu thông tin thanh toán (hiện `undefined` hoặc `0`).

**Cách sửa:** Thêm các field còn thiếu vào select query:

```diff
  booking:bookings(
    id,
    customer:customers(*),
    booking_items(*, camera:cameras(*)),
    booking_accessories(*),
    payment_status,
    deposit_type,
    deposit_amount,
-   cccd_name
+   cccd_name,
+   pickup_time,
+   return_time,
+   final_fee,
+   late_fee,
+   total_delivery_fee,
+   has_vneid
  )
```

---

## 🟡 BUG #5: Hủy đơn không dọn dẹp tasks

**File:** `app/(dashboard)/bookings/[id]/page.tsx` dòng 63-85

**Vấn đề:** Khi hủy booking, code chỉ set `payment_status = 'cancelled'`. Tasks vẫn tồn tại trong DB. Mặc dù đã fix filter ở API tasks, nhưng tasks vẫn chiếm DB và có thể gây nhầm lẫn trong analytics.

**Gợi ý:** Cân nhắc thêm logic xóa hoặc đánh dấu tasks khi hủy booking (không bắt buộc vì filter đã hoạt động).

---

## 🟡 BUG #6: Khôi phục booking không tạo lại tasks

**File:** `app/api/bookings/[id]/restore/route.ts`

**Vấn đề:** Khi khôi phục booking đã hủy, code chỉ set lại `payment_status` nhưng **không kiểm tra tasks**. Nếu trước đó tasks đã bị xóa hoặc completed, booking khôi phục nhưng không có tasks → không hiện ở trang Nhận/Trả máy.

**Cách sửa:** Sau khi restore, kiểm tra và tạo lại tasks nếu cần.

---

## 🟡 BUG #7: Task PATCH API không validate input

**File:** `app/api/tasks/[id]/route.ts`

**Vấn đề:** API nhận body và pass thẳng vào `.update(body)` mà không validate. Bất kỳ field nào cũng có thể bị ghi đè.

```typescript
const { data, error } = await supabase
  .from('tasks')
  .update(body)  // ← Nguy hiểm: body chưa sanitized
  .eq('id', params.id)
```

**Rủi ro:** Nếu frontend gửi nhầm field (ví dụ `booking_id`), có thể ghi đè dữ liệu sai.

**Cách sửa:** Whitelist các field được phép update: `completed_at`, `staff_id`, `location`, `delivery_fee`, `due_at`.

---

## 🟢 BUG #8: Trang Trả máy hiển thị `booking.late_fee` cũ

**File:** `app/(dashboard)/tasks/return/page.tsx` dòng 401-406

**Vấn đề:** Card trả máy hiển thị `task.booking.late_fee + task.booking.final_fee + total_delivery_fee`. Nhưng `late_fee` ở đây là giá trị cũ từ DB (thường = 0), chưa tính late fee thực tế tại thời điểm trả máy.

**Sau khi fix hôm nay:** Late fee giờ được nhập thủ công, nên giá trị trên card chỉ đúng sau khi đã xử lý trả máy (khi `late_fee` đã được lưu vào DB). Trước khi xử lý, số tiền hiển thị = `final_fee + 0 + delivery_fee` → chưa bao gồm phí trễ.

**Gợi ý:** Có thể thêm dòng nhỏ "(chưa bao gồm phí trễ)" dưới số tiền trên card.

---

## ✅ Các flow đã hoạt động tốt

| Flow | Chi tiết |
|------|---------|
| Tạo booking | Kiểm tra conflict máy + phụ kiện, rollback nếu lỗi |
| Cập nhật khách hàng | SĐT chính/phụ, tên, kênh liên hệ đều update được |
| Filter cancelled tasks | Tasks của đơn hủy không hiện ở Nhận/Trả máy |
| Sync thời gian task | Sửa giờ booking → tasks tự cập nhật `due_at` |
| Phí trả trễ thủ công | Nhân viên tự nhập khi hoàn thành đơn |

---

## 📋 Thứ tự ưu tiên sửa

| # | Bug | Ưu tiên | Lý do |
|---|-----|---------|-------|
| 1 | Bug #1: Pickup set sai `paid` | 🔴 Cao | Ảnh hưởng logic thanh toán |
| 2 | Bug #4: API thiếu fields | 🔴 Cao | Trang trả máy có thể crash/sai |
| 3 | Bug #3: Edit không lưu items | 🔴 Cao | Sửa thiết bị nhưng không có tác dụng |
| 4 | Bug #7: Task API không validate | 🟡 TB | Rủi ro bảo mật |
| 5 | Bug #2: Undo không reset status | 🟡 TB | Tự hết nếu sửa Bug #1 |
| 6 | Bug #5: Hủy không xóa tasks | 🟢 Thấp | Đã có filter, ít ảnh hưởng |
| 7 | Bug #6: Restore không check tasks | 🟢 Thấp | Ít khi dùng restore |
| 8 | Bug #8: Hiển thị phí chưa chính xác | 🟢 Thấp | Cosmetic |
