# Kantra Camera Booking System

Hệ thống quản lý booking cho thuê máy ảnh được xây dựng với Next.js 14, TypeScript, Tailwind CSS và Supabase.

## Công nghệ sử dụng

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling với dark mode support
- **Supabase** - Database và Authentication
- **Material Symbols** - Icons

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env.local` với các biến môi trường:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Chạy database schema trong Supabase Dashboard:
- Mở file `database_schema.sql`
- Chạy trong Supabase SQL Editor

4. Chạy development server:
```bash
npm run dev
```

5. Mở [http://localhost:3000](http://localhost:3000) trong browser

## Cấu trúc dự án

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   │   └── login/         # Trang đăng nhập
│   ├── (dashboard)/       # Protected routes
│   │   ├── calendar/      # Lịch booking
│   │   ├── bookings/      # Quản lý bookings
│   │   ├── tasks/         # Tác vụ nhận/trả máy
│   │   ├── recovery/      # Recovery tasks
│   │   ├── dashboard/     # Dashboard doanh thu (Admin)
│   │   ├── employees/     # Quản lý nhân viên (Admin)
│   │   └── settings/      # Cài đặt hệ thống (Admin)
│   └── layout.tsx         # Root layout với AuthProvider
├── components/            # React components
│   └── ui/                # UI components từ kit
├── lib/                   # Utilities
│   ├── supabase/          # Supabase clients
│   ├── auth/              # Auth context
│   └── types/             # TypeScript types
└── hooks/                 # Custom React hooks
```

## Tính năng đã implement

### ✅ Đã hoàn thành

1. **Setup cơ bản**
   - Next.js 14 với TypeScript
   - Tailwind CSS với theme từ UI kit
   - Supabase client setup
   - TypeScript types từ database schema

2. **Authentication**
   - Trang đăng nhập với 2 form (Admin & Employee)
   - Auth middleware và route protection
   - Auth context và hooks

3. **Layout & Navigation**
   - Sidebar component với navigation động
   - Dashboard layout với responsive design
   - User menu và logout

4. **UI Components**
   - Button component
   - Input component
   - Card component

### 🚧 Đang phát triển

- Calendar page với grid theo model/ngày
- Multi-step booking form
- Tasks management pages
- Recovery tasks page
- Admin features (dashboard, employees, settings)

## Đăng nhập

### Admin
- Username: `admin`
- Password: `admin123` (mặc định từ database schema)

### Employee
- Sử dụng email đã được Admin cấp quyền trong bảng `employees`
- Magic link sẽ được gửi qua email

## Lưu ý

- Database schema đã được thiết kế sẵn trong `database_schema.sql`
- UI kit được lưu trong folder `stitch_ui_kit_overview_dark_mode`
- Tất cả logic nghiệp vụ tuân theo `plan.txt`

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```




