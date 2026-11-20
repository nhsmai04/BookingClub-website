import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePriceApi } from '../../services/subfield.api';
import { createBookingApi } from '../../services/booking.api';
import './ConfirmBookingPage.scss';

const ConfirmBookingPage = () => {
const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookingDetailsWithPrice, setBookingDetailsWithPrice] = useState<any[]>([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    const stateData = location.state?.bookingData;
    const savedData = sessionStorage.getItem('pendingBooking');
    const data = stateData || (savedData ? JSON.parse(savedData) : null);
    if (!data?.booking_details?.length) { navigate('/complexes/search'); return; }
    setBookingData(data);
    
    sessionStorage.setItem('pendingBooking', JSON.stringify(data));
  }, [loading, user, navigate, location.state]);
console.log('Loaded booking data:', bookingData);
  useEffect(() => {
    if (!bookingData?.booking_details?.length) return;
    let cancelled = false;
    setIsLoadingPrice(true);
    Promise.all(bookingData.booking_details.map(async (detail: any) => {
      try {
        const response = await calculatePriceApi({
          subField_id: detail.sub_field_id,
          playDate: detail.playDate,
          startTime: detail.startTime,
          endTime: detail.endTime,
        });
        return { ...detail, price: response.price, services: detail.services || [] };
      } catch (error) {
        console.error('Lỗi tính tiền sân:', error);
        return { ...detail, price: Number(detail.price) || 0, services: detail.services || [] };
      }
    })).then((details) => { if (!cancelled) setBookingDetailsWithPrice(details); })
      .finally(() => { if (!cancelled) setIsLoadingPrice(false); });
    return () => { cancelled = true; };
  }, [bookingData]);

  // Thông tin người đặt sân
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [useAccountInfo, setUseAccountInfo] = useState(true);
  useEffect(() => {
    if (user && useAccountInfo) {
      setCustomerName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user, useAccountInfo]);bookingData

  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo' | 'card'>('vietqr');

  // Đếm ngược thời gian giữ chỗ (mặc định 09:44 = 584 giây)
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (!bookingData?.bookingExpiresAt) {
      setCountdown(0);
      return;
    }
    const expiresAt = new Date(bookingData.bookingExpiresAt).getTime();
    setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  }, [bookingData]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const services = useMemo(() => bookingDetailsWithPrice.flatMap((detail) => detail.services || []), [bookingDetailsWithPrice]);
  const totalCourtPrice = bookingDetailsWithPrice.reduce((sum, detail) => sum + (Number(detail.price) || 0), 0);
  const totalServiceFee = services.reduce((sum: number, service: any) => sum + (Number(service.price) || 0), 0);
  const grandTotal = totalCourtPrice + totalServiceFee;
  const firstDetail = bookingDetailsWithPrice[0];
  const displayCourtName = firstDetail?.courtName || 'Sân cầu lông';
  const displayDate = firstDetail?.playDate ? new Date(firstDetail.playDate).toLocaleDateString('vi-VN') : '—';
  const displaySlots = bookingDetailsWithPrice.map((detail) => `${detail.startTime} - ${detail.endTime}`).join(', ');

  // Xử lý gửi đơn tiếp tục thanh toán
  const handleProceedPayment = async () => {
    if (isLoadingPrice) return;
    if (bookingData.bookingId && bookingData.bookingExpiresAt && Date.parse(bookingData.bookingExpiresAt) <= Date.now()) {
      alert('Thời gian giữ chỗ đã hết. Vui lòng chọn lại khung giờ.');
      navigate(`/complexes/${bookingData.slug || bookingData.complex_id}`);
      return;
    }
    if (!customerName.trim() || !phone.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
      return;
    }

    setIsProceeding(true);
    try {
      let bookingId = bookingData.bookingId || bookingData._id;
      let bookingExpiresAt = bookingData.bookingExpiresAt;
      if (!bookingId) {
        const createdBooking = await createBookingApi({
          complex_id: bookingData.complex_id,
          booking_date: bookingData.booking_date || new Date().toISOString(),
          booking_details: bookingDetailsWithPrice.map((detail: any) => ({
            sub_field_id: detail.sub_field_id,
            play_date: detail.playDate,
            startTime: detail.startTime,
            endTime: detail.endTime,
            services: (detail.services || []).map((service: any) => service.id),
          })),
        });
        bookingId = createdBooking.data._id;
        const createdAt = new Date(createdBooking.data.createdAt || Date.now()).getTime();
        bookingExpiresAt = new Date(createdAt + 10 * 60 * 1000).toISOString();
      }

      const payload = {
        ...bookingData,
        bookingId,
        bookingExpiresAt,
        customerName,
        phone,
        email,
        notes,
        booking_details: bookingDetailsWithPrice,
        totalAmount: grandTotal,
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(payload));
      navigate(`/complexes/${bookingData.complex_id}/booking/payment`, { state: { bookingData: payload } });
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Không thể giữ chỗ. Vui lòng thử lại.');
    } finally {
      setIsProceeding(false);
    }
  };

  if (loading || !user || !bookingData) return null;

  return (
    <div className="booking-page-container">
      
      {/* 2. Đường dẫn breadcrumbs */}
      <div className="breadcrumb-wrapper">
        <div className="breadcrumb-container">
          <span className="crumb-link">Trang chủ</span>
          <span className="crumb-divider">/</span>
          <button className="crumb-link" onClick={() => navigate(-1)}>
            <span className="crumb-link">Đặt sân cầu lông</span>
          </button>
          <span className="crumb-divider">/</span>
          <span className="crumb-active">Xác nhận đặt lịch {bookingData?.complex_name}</span>
        </div>
      </div>

      {/* 3. Thanh tiến trình Stepper */}
      <div className="stepper-section">
        <div className="stepper-container">
          <div className="step-item step-completed">
            <div className="step-indicator">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="step-text">
              <span className="step-tag">BƯỚC 1</span>
              <strong className="step-title">Chọn sân &amp; giờ chơi</strong>
            </div>
          </div>

          <div className="step-item step-active">
            <div className="step-indicator">2</div>
            <div className="step-text">
              <span className="step-tag">BƯỚC 2 (HIỆN TẠI)</span>
              <strong className="step-title">Xác nhận &amp; Thanh toán</strong>
            </div>
          </div>

          <div className="step-item step-upcoming">
            <div className="step-indicator">3</div>
            <div className="step-text">
              <span className="step-tag">BƯỚC 3</span>
              <strong className="step-title">Hoàn tất đặt sân</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Nội dung chính: 2 Cột Desktop */}
      <main className="main-content-layout">
        <div className="content-grid-wrapper">
          {/* CỘT TRÁI: Chi tiết sân + Form thông tin + Dịch vụ phụ */}
          <div className="left-content-column">
            {/* Card thông tin & hình ảnh sân đấu */}
            <section className="court-hero-card">
              <div className="hero-image-box">
                <img src={bookingData?.complex_images?.[1] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80'} alt={displayCourtName} className="hero-img" />
                <div className="hero-overlay-badges">
                  <span className="badge-available">
                    <span className="dot-pulse"></span> SẴN SÀNG GIỮ CHỖ
                  </span>
                  <span className="badge-category">{bookingData?.complex_rating ?? bookingData?.complex_ratings ?? ''}{''}⭐</span>
                </div>
                <div className="hero-caption">
                  <h2 className="court-title">{bookingDetailsWithPrice.length > 1 ? `${displayCourtName} và ${bookingDetailsWithPrice.length - 1} sân khác` : displayCourtName}</h2>
                  <p className="court-address">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {bookingData?.complex_address || 'Thông tin sân đã chọn'}
                  </p>
                </div>
              </div>

              <div className="court-specs-grid">
                <div className="spec-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  <span>Kích thước 13.4m × 6.1m</span>
                </div>
                <div className="spec-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>Thảm Taraflex chuyên dụng</span>
                </div>
                <div className="spec-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M12 2a6 6 0 0 0-6 6c0 2.22 1.21 4.15 3 5.19V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.81c1.79-1.04 3-2.97 3-5.19a6 6 0 0 0-6-6z" />
                  </svg>
                  <span>LED chống chói 500 Lux</span>
                </div>
                <div className="spec-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                  </svg>
                  <span>Quạt làm mát &amp; Ghế nghỉ VIP</span>
                </div>
              </div>
            </section>

            {/* Card Biểu mẫu thông tin người nhận sân */}
            <section className="form-customer-card">
              <div className="card-title-row">
                <div className="title-left">
                  <span className="card-icon-tag">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <h3 className="section-title">Thông tin người đặt sân</h3>
                </div>
                <label className="checkbox-quick-fill">
                  <input
                    type="checkbox"
                    checked={useAccountInfo}
                    onChange={(e) => setUseAccountInfo(e.target.checked)}
                  />
                  <span>Sử dụng thông tin tài khoản</span>
                </label>
              </div>

              <div className="form-fields-grid">
                <div className="input-group">
                  <label>HỌ VÀ TÊN NGƯỜI NHẬN SÂN <span className="req">*</span></label>
                  <div className="input-field-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>SỐ ĐIỆN THOẠI LIÊN HỆ <span className="req">*</span></label>
                  <div className="input-field-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>EMAIL NHẬN VÉ ĐIỆN TỬ &amp; MÃ QR VÀO SÂN</label>
                  <div className="input-field-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>GHI CHÚ CHO BAN QUẢN LÝ SÂN (KHÔNG BẮT BUỘC)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Nhờ bật đèn trước 5 phút giúp mình, chuẩn bị thêm nước nóng..."
                  />
                </div>
              </div>
            </section>

            {/* Card Dịch vụ & Tiện ích bổ sung */}
            <section className="services-extra-card">
              <div className="card-title-row">
                <div className="title-left">
                  <span className="card-icon-tag">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </span>
                  <h3 className="section-title">Dịch vụ &amp; Tiện ích bổ sung</h3>
                </div>
                <span className="hint-tag">Tùy chọn linh hoạt</span>
              </div>

              <div className="service-items-list">
                {services.map((item: any, index: number) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="service-item-row item-checked"
                  >
                    <div className="service-checkbox-col">
                      <input type="checkbox" checked readOnly aria-label={item.name} />
                    </div>
                    <div className="service-meta-col">
                      <strong className="service-name">{item.name}</strong>
                      <p className="service-desc">{item.description}</p>
                    </div>
                    <div className="service-price-col">+{(Number(item.price) || 0).toLocaleString('vi-VN')} đ</div>
                  </div>
                ))}
                {services.length === 0 && <p className="service-desc">Chưa chọn dịch vụ bổ sung.</p>}
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: Tóm tắt mã giữ chỗ + Đếm ngược + Chi phí + Phương thức thanh toán */}
          <aside className="right-summary-column">
            <div className="summary-sticky-card">
              {/* Mã đơn và loại sân */}
              <div className="order-meta-header">
                <span className="badge-sport-tag">ĐẶT SÂN</span>
              </div>

              {/* Lịch thi đấu đã chọn */}
              <div className="timeslot-highlight-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div>
                  <div className="slot-date">{displayDate}</div>
                  <div className="slot-time">Khung giờ: {displaySlots || '—'}</div>
                </div>
              </div>

              {/* Đồng hồ đếm ngược giữ chỗ */}
              <div className="countdown-pill-card">
                <div className="countdown-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Thời gian giữ chỗ:</span>
                </div>
                <span className="countdown-timer">{bookingData.bookingExpiresAt ? formatCountdown(countdown) : 'Chưa bắt đầu'}</span>
              </div>

              {/* Bảng kê chi phí */}
              <div className="fee-breakdown-list">
                <div className="fee-row">
                  <span>Tiền thuê sân:</span>
                  <span>{totalCourtPrice.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="fee-row">
                  <span>Dịch vụ &amp; Tiện ích thêm:</span>
                  <span>{totalServiceFee.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="fee-row text-discount">
                  <span>Khuyến mãi tân thủ:</span>
                  <span>-0 đ</span>
                </div>

                <div className="fee-divider"></div>

                <div className="fee-total-row">
                  <span className="total-label">Tổng thanh toán:</span>
                  <span className="total-number">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Chọn phương thức thanh toán */}
              <div className="payment-select-section">
                <h4 className="payment-section-heading">CHỌN PHƯƠNG THỨC THANH TOÁN</h4>

                {/* Option 1: VietQR */}
                <label className={`payment-method-row ${paymentMethod === 'vietqr' ? 'active-method' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vietqr"
                    checked={paymentMethod === 'vietqr'}
                    onChange={() => setPaymentMethod('vietqr')}
                  />
                  <div className="method-info">
                    <div className="method-name">VietQR Chuyển khoản tức thì</div>
                    <div className="method-sub">Techcombank / Quét QR 24/7 không phí</div>
                  </div>
                  <div className="method-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </div>
                </label>

                {/* Option 2: Ví MoMo / ZaloPay */}
                <label className={`payment-method-row ${paymentMethod === 'momo' ? 'active-method' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                  />
                  <div className="method-info">
                    <div className="method-name">Ví MoMo / ZaloPay</div>
                    <div className="method-sub">Thanh toán một chạm qua app</div>
                  </div>
                  <div className="method-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                </label>

                {/* Option 3: Thẻ ATM / Visa */}
                <label className={`payment-method-row ${paymentMethod === 'card' ? 'active-method' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <div className="method-info">
                    <div className="method-name">Thẻ ATM Nội địa / Visa / Master</div>
                    <div className="method-sub">Cổng thanh toán bảo mật OnePay</div>
                  </div>
                  <div className="method-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                </label>
              </div>

              {/* Nút hành động */}
              <button
                type="button"
                className="btn-proceed-cta"
                onClick={handleProceedPayment}
                disabled={isProceeding || isLoadingPrice || (!!bookingData.bookingId && countdown <= 0)}
              >
                <span>{isProceeding ? 'ĐANG GIỮ CHỖ...' : 'TIẾP TỤC THANH TOÁN'}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                type="button"
                className="btn-back-link"
                onClick={() => navigate(-1)}
              >
                ← Quay lại chọn giờ khác
              </button>

              <div className="security-notice">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Bảo mật thông tin 100% • Giữ chỗ tự động</span>
              </div>
            </div>

          </aside>
        </div>
      </main>

    </div>
  );    
};

export default ConfirmBookingPage;
