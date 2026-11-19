import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import "./PaymentResult.css";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem("pendingBooking");
  }, []);

  // Đọc params từ URL do Backend redirect trả về
  const bookingStatus = searchParams.get("bookingStatus") || "Thành công";

  return (
    <div className="payment-result-wrapper">
      <div className="payment-result-card">
        
        <div className="payment-icon-container">
          <CheckCircle size={72} color="#10b981" strokeWidth={1.5} />
        </div>

        <h2 className="payment-result-title">Thanh toán thành công!</h2>
        <p className="payment-result-message">
          Cảm ơn bạn đã đặt sân. Giao dịch của bạn đã được VNPay ghi nhận.
        </p>

        <div className="payment-info-box">
          <div className="info-box-row">
            <span className="info-box-label">Trạng thái:</span>
            <span className="info-box-value value-success">{bookingStatus.toUpperCase()}</span>
          </div>
        </div>

        <button className="payment-btn" onClick={() => navigate("/management")}>
          Xem lịch đặt sân
        </button>
        <button className="payment-btn-outline" onClick={() => navigate("/")}>
          Về trang chủ
        </button>

      </div>
    </div>
  );
}
