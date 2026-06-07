# BookingClub-website
# BookingClub

BookingClub là nền tảng đặt sân thể thao trực tuyến, giúp người dùng tìm kiếm cụm sân, xem vị trí trên bản đồ, kiểm tra khung giờ trống, đặt sân và thanh toán trực tuyến.

## Tính năng chính

- Đăng ký, đăng nhập, đăng xuất và xác thực email.
- Quản lý hồ sơ cá nhân và thay đổi mật khẩu.
- Tìm kiếm cụm sân theo tên, địa điểm và môn thể thao.
- Xem danh sách sân nổi bật và vị trí cụm sân trên bản đồ.
- Xem thông tin chi tiết, hình ảnh, giờ mở cửa và đánh giá của cụm sân.
- Kiểm tra khung giờ còn trống và tính giá sân.
- Đặt sân, theo dõi lịch sử và hủy booking.
- Thanh toán trực tuyến qua VNPay.
- Đánh giá sân sau khi hoàn thành booking.
- Tự động hủy booking quá hạn thanh toán và cập nhật booking đã hoàn thành.

## Công nghệ sử dụng

### Frontend

- React 19, TypeScript và Vite
- React Router
- Axios
- Leaflet và React Leaflet
- Framer Motion
- SCSS/CSS

### Backend

- Node.js và Express
- MongoDB và Mongoose
- JWT, HTTP-only cookie và CSRF protection
- Joi validation
- Nodemailer
- VNPay
- Jest

### Triển khai

- Docker và Docker Compose
- Nginx
- Render
- MongoDB Atlas

## Cấu trúc thư mục

```text
BookingClub-website/
├── be/                    # Express API, models, services và tests
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── server.js
├── fe/                    # React + TypeScript frontend
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       ├── routes/
│       └── services/
├── docker-compose.yml
└── render.yaml
```

## Yêu cầu

- Node.js 20 trở lên
- npm
- MongoDB local hoặc MongoDB Atlas
- Tài khoản SMTP nếu sử dụng gửi email
- Thông tin VNPay Sandbox nếu sử dụng thanh toán

## Cài đặt và chạy local

### 1. Clone repository

```bash
git clone <repository-url>
cd BookingClub-website
```

### 2. Cấu hình backend

```bash
cd be
npm install
cp .env.example .env
```

Cập nhật file `be/.env`:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/BookingClub
DB_NAME=BookingClub

JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=7d

CORS_ALLOWED_ORIGINS=http://localhost:5174
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

FRONTEND_URL=http://localhost:5174
CLIENT_URL=http://localhost:5174
API_BASE_URL=http://localhost:5001

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com

VNPAY_EXPIRE_MINUTES=10
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_SECURE_SECRET=your-vnpay-secure-secret
VNPAY_HOST=https://sandbox.vnpayment.vn
VNPAY_RETURN_URL=http://localhost:5001/api/v1/payments/vnpay/return
```

Chạy backend:

```bash
npm run dev
```

API mặc định chạy tại `http://localhost:5001`.

### 3. Cấu hình frontend

Mở terminal mới:

```bash
cd fe
npm install
cp .env.example .env
```

Cập nhật file `fe/.env`:

```env
VITE_BACKEND_URL=http://localhost:5001
```

Chạy frontend:

```bash
npm run dev
```

Ứng dụng mặc định chạy tại `http://localhost:5174`.

### 4. Import dữ liệu mẫu

Sau khi cấu hình kết nối MongoDB:

```bash
cd be
npm run import
```

## Chạy bằng Docker

Tạo `be/.env` và `fe/.env` từ các file mẫu, sau đó chạy:

```bash
docker compose up --build
```

Docker Compose hiện sử dụng MongoDB từ `MONGO_URI` trong `be/.env`.

## Các API chính

Base URL: `/api/v1`

| Nhóm | Endpoint tiêu biểu |
| --- | --- |
| Authentication | `/register`, `/login`, `/logout`, `/refresh`, `/verify-email` |
| User | `/me`, `/me/update`, `/me/update-password` |
| Sport complex | `/sportcomplex/search`, `/sportcomplex/map`, `/sportcomplex/featured`, `/sportcomplex/detail/:slug` |
| Sub-field | `/subfield/calculate-price`, `/subfield/:id/available-time-slots` |
| Booking | `/bookings`, `/bookings/history`, `/bookings/:bookingId/cancel` |
| Payment | `/bookings/:bookingId/payments/vnpay`, `/payments/vnpay/return` |
| Review | `/reviews`, `/reviews/with-stats`, `/reviews/:id` |

## Scripts

### Backend

```bash
npm run dev       # Chạy server với nodemon
npm start         # Chạy server production
npm test          # Chạy Jest tests
npm run import    # Import dữ liệu mẫu
```

### Frontend

```bash
npm run dev       # Chạy Vite development server
npm run build     # Build production
npm run lint      # Kiểm tra ESLint
npm run preview   # Xem bản build production
```

## Kiểm thử

```bash
cd be
npm test

cd ../fe
npm run lint
npm run build
```

## Triển khai

Repository có sẵn `render.yaml` để triển khai frontend và backend lên Render. Khi triển khai production, hãy cấu hình các secret như `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, SMTP và VNPay trên dashboard của nền tảng triển khai.

Không commit file `.env` hoặc bất kỳ khóa bí mật nào lên GitHub.

## Giấy phép

Project được phát triển cho mục đích học tập.
