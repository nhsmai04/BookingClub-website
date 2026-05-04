import helmet from "helmet";

/**
 * Security Middleware - Thiết lập HTTP headers bảo mật
 * 
 * Các headers được thiết lập:
 * 1. X-XSS-Protection: Ngăn chặn XSS attacks trên các trình duyệt cũ
 * 2. X-Content-Type-Options: Ngăn chặn MIME-type sniffing
 * 3. Strict-Transport-Security: Bắt buộc HTTPS
 * 4. Content-Security-Policy: Ngăn chặn inline scripts và external unauthorized scripts
 * 5. X-Frame-Options: Ngăn chặn clickjacking attacks
 * 6. Referrer-Policy: Kiểm soát referrer information
 */

export const securityMiddleware = helmet({
  // Bật X-XSS-Protection header (1; mode=block)
  xssFilter: true,

  // Bật X-Content-Type-Options: nosniff
  noSniff: true,

  // Bật Strict-Transport-Security (cho production)
  hsts: {
    maxAge: 31536000, // 1 năm (giây)
    includeSubDomains: true,
    preload: true
  },

  // Content-Security-Policy: Chính sách bảo mật nội dung
  // Ngăn chặn việc chạy script từ nguồn không rõ
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],  // Chỉ cho phép từ cùng domain
      scriptSrc: [
        "'self'",  // Script từ cùng domain
        // Nếu cần external CDN, thêm vào đây: "https://cdn.example.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",  // Cho phép inline CSS (có thể tối ưu sau)
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",  // Cho phép hình từ HTTPS
      ],
      fontSrc: [
        "'self'",
        "data:",
      ],
      connectSrc: [
        "'self'",
        "http://localhost:*",  // Local dev
        "https://*.example.com",  // Thêm domain API ngoài nếu cần
      ],
      frameSrc: ["'none'"],  // Ngăn chặn iframe
      objectSrc: ["'none'"],  // Ngăn chặn <object> và <embed>
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],  // X-Frame-Options equivalent
    },
    // Report CSP violations để monitoring (optional)
    reportUri: "/api/v1/security/csp-report",
  },

  // X-Frame-Options: DENY (ngăn chặn clickjacking)
  frameguard: {
    action: "deny",
  },

  // Referrer-Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

/**
 * Endpoint nhận CSP violation reports (optional - để monitoring)
 * Ghi log các CSP violations
 */
export const cspReportHandler = (req, res) => {
  const cspReport = req.body;
  console.warn("[CSP Violation Report]", JSON.stringify(cspReport, null, 2));
  res.status(204).send();
};
