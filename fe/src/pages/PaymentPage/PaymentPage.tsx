import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePriceApi } from '../../services/subfield.api';
import { createVnpayPaymentApi } from '../../services/booking.api';
import './PaymentPage.scss';

interface BookingSummary {
  customerName: string;
  phone: string;
  bookingCode: string;
  playDate: string;
  timeSlot: string;
  courtName: string;
  courtCategory: string;
  totalAmount: number;
}

interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrImageUrl: string;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any[]>([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const totalCourtPrice = bookingDetails.reduce((sum, detail) => sum + (Number(detail.price) || 0), 0);
  const totalServicePrice = bookingDetails.reduce((sum, detail) => sum + (detail.services || []).reduce((serviceSum: number, service: any) => serviceSum + (Number(service.price) || 0), 0), 0);
  const totalAmount = totalCourtPrice + totalServicePrice;
  const firstBookingDetail = bookingDetails[0];
  const bookingCode = bookingData?.bookingCode || `#${String(bookingData?.bookingId || bookingData?.complex_id || '').slice(-6) || 'MỚI'}`;
  const playDate = firstBookingDetail?.playDate ? new Date(firstBookingDetail.playDate).toLocaleDateString('vi-VN') : '—';
  const timeSlot = bookingDetails.map((detail) => `${detail.startTime} - ${detail.endTime}`).join(', ') || '—';
  const courtName = bookingDetails.length > 1 ? `${firstBookingDetail?.courtName || 'Sân'} và ${bookingDetails.length - 1} sân khác` : firstBookingDetail?.courtName || 'Sân đã chọn';
  const courtCategory = bookingData?.courtCategory || 'ĐẶT SÂN';

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    const passed = location.state?.bookingData;
    const saved = sessionStorage.getItem('pendingBooking');
    const data = passed || (saved ? JSON.parse(saved) : null);
    if (!data?.booking_details?.length) { navigate('/complexes/search'); return; }
    setBookingData(data);
    sessionStorage.setItem('pendingBooking', JSON.stringify(data));
  }, [loading, user, location.state, navigate]);

  useEffect(() => {
    if (!bookingData?.booking_details?.length) return;
    let cancelled = false;
    setIsLoadingPrice(true);
    Promise.all(bookingData.booking_details.map(async (detail: any) => {
      try {
        const response = await calculatePriceApi({ subField_id: detail.sub_field_id, playDate: detail.playDate, startTime: detail.startTime, endTime: detail.endTime });
        return { ...detail, price: response.price, services: detail.services || [] };
      } catch (error) {
        console.error('Lỗi tính tiền sân:', error);
        return { ...detail, price: Number(detail.price) || 0, services: detail.services || [] };
      }
    })).then((details) => { if (!cancelled) setBookingDetails(details); })
      .finally(() => { if (!cancelled) setIsLoadingPrice(false); });
    return () => { cancelled = true; };
  }, [bookingData]);

  // 2. Thông tin tài khoản thụ hưởng VietQR
  const [bankInfo] = useState<BankAccountInfo>({
    bankName: 'TECHCOMBANK',
    accountNumber: '1904 0040 9760 11',
    accountName: 'PHAN THI MY PHUONG',
    transferContent: 'MD 18926 Nguyen Vu Nguyen',
    // QR Code tự động VietQR chuẩn NAPAS 247
    qrImageUrl: '',
  });

  // 3. Đồng hồ đếm ngược giữ chỗ (05:49 = 349 giây)
  const [countdown, setCountdown] = useState<number>(600);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (!bookingData) return;
    const createdAt = bookingData.createdAt ? new Date(bookingData.createdAt).getTime() : Date.now();
    const expiresAt = bookingData.bookingExpiresAt
      ? new Date(bookingData.bookingExpiresAt).getTime()
      : createdAt + 10 * 60 * 1000;
    setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  }, [bookingData]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4. Xử lý sao chép văn bản
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 5. Xử lý tải ảnh ủy nhiệm chi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptImage(previewUrl);
    }
  };

  // 6. Xử lý xác nhận đã chuyển khoản
  const handleConfirmTransfer = async () => {
    if (!bookingData?.bookingId || isLoadingPrice) {
      alert('Không tìm thấy thông tin giữ chỗ. Vui lòng quay lại bước xác nhận.');
      return;
    }
    setIsSubmitting(true);
    try {
      const paymentResponse = await createVnpayPaymentApi(bookingData.bookingId);
      window.location.href = paymentResponse.paymentUrl;
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || !bookingData) return null;

  return (
    <div className="payment-qr-container">
      {/* 1. Header điều hướng thanh toán */}
      <header className="payment-header">
        <div className="header-inner">
          <div className="header-left">
            <button
              type="button"
              className="btn-back-circle"
              onClick={() => navigate(`/complexes/${bookingData.complex_id}/booking/confirm`, { state: { bookingData } })}
              aria-label="Quay lại"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="header-title-box">
              <h1 className="page-heading">Thanh toán đặt sân</h1>
              <p className="page-subheading">Hoàn tất đặt lịch trong vài bước đơn giản</p>
            </div>
          </div>

          <div className="header-right">
            <div className="secure-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span>Thanh toán bảo mật qua VNPay</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Dải thông báo đếm ngược giữ chỗ */}
      <div className="countdown-strip-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Đơn của bạn còn được giữ chỗ trong:</span>
        <span className="countdown-pill">{formatCountdown(countdown)}</span>
      </div>

      {/* 3. Khung nội dung chính: 2 Cột */}
      <main className="main-payment-layout">
        <div className="payment-grid-wrapper">
          {/* CỘT TRÁI: VietQR & Upload Ủy nhiệm chi */}
          <div className="left-qr-column">
            {/* Card thông tin ngân hàng & QR Code */}
            <section className="vietqr-card" style={{ display: 'none' }}>
              <div className="qr-display-box">
                <div className="qr-image-wrapper">
                  {/* SVG mô phỏng khung QR nếu chưa load ảnh */}
                  <svg className="qr-svg" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    <path d="M10 10h30v30H10V10zm6 6v18h18V16H16z" fill="#111827" />
                    <rect x="20" y="20" width="10" height="10" fill="#111827" />
                    <path d="M60 10h30v30H60V10zm6 6v18h18V16H66z" fill="#111827" />
                    <rect x="70" y="20" width="10" height="10" fill="#111827" />
                    <path d="M10 60h30v30H10V60zm6 6v18h18V66H16z" fill="#111827" />
                    <rect x="20" y="70" width="10" height="10" fill="#111827" />
                    <rect x="45" y="15" width="8" height="8" fill="#111827" />
                    <rect x="45" y="35" width="8" height="15" fill="#111827" />
                    <rect x="65" y="55" width="20" height="8" fill="#111827" />
                    <rect x="55" y="75" width="12" height="15" fill="#111827" />
                    <rect x="75" y="75" width="15" height="15" fill="#111827" />
                    {/* Logo VietQR giữa tâm */}
                    <circle cx="50" cy="50" r="10" fill="#059669" />
                    <path d="M46 50h8M50 46v8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="qr-badge-caption">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>QUÉT VIETQR</span>
                </div>
              </div>

              <div className="bank-details-box">
                <div className="bank-badge-header">
                  <span className="tag-bank">
                    <span className="red-dot"></span> {bankInfo.bankName}
                  </span>
                  <a
                    href={bankInfo.qrImageUrl}
                    download="VietQR-SportTech.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-download-qr"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Tải QR</span>
                  </a>
                </div>

                <h3 className="account-owner-name">{bankInfo.accountName}</h3>

                <div className="info-field-group">
                  <div>
                    <span className="field-label">SỐ TÀI KHOẢN</span>
                    <div className="field-value-text">{bankInfo.accountNumber}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-copy-icon"
                    onClick={() => handleCopy(bankInfo.accountNumber.replace(/\s/g, ''), 'acc')}
                    title="Sao chép số tài khoản"
                  >
                    {copiedKey === 'acc' ? (
                      <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>Đã chép!</span>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="transfer-content-group">
                  <div className="content-left">
                    <span className="content-label">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)</span>
                    <div className="content-syntax">{bankInfo.transferContent}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-copy-badge"
                    onClick={() => handleCopy(bankInfo.transferContent, 'syntax')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copiedKey === 'syntax' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="vietqr-card">
              <div className="bank-details-box">
                <div className="bank-badge-header"><span className="tag-bank">CỔNG THANH TOÁN VNPay</span></div>
                <h3 className="account-owner-name">Thanh toán trực tuyến an toàn</h3>
                <p className="field-value-text">
                  Nhấn nút thanh toán để tạo đơn đặt sân. Hệ thống sẽ chuyển bạn đến VNPay để hoàn tất giao dịch và tự động cập nhật kết quả.
                </p>
              </div>
            </section>

            {/* Thông báo nhắc nhở chuyển khoản */}
            <div className="payment-alert-warning">
              <svg className="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 3.5L20.3 19H3.7L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
              <div>
                Bạn sẽ được chuyển đến cổng thanh toán VNPay để thanh toán{' '}
                <span className="highlight-exact-amount">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>{' '}
                an toàn. Đơn đặt sân sẽ được tạo trước khi mở cổng thanh toán.
              </div>
            </div>

            {/* Khung tải ảnh ủy nhiệm chi */}
            <section className="receipt-upload-card" style={{ display: 'none' }}>
              <div className="card-header-row">
                <h3 className="upload-title">
                  Hình ảnh biên nhận thanh toán <span className="req">*</span>
                </h3>
                <span className="upload-hint">Định dạng: JPG, PNG, HEIC (Max 5MB)</span>
              </div>

              <label className="upload-dropzone-box">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/heic"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {receiptImage ? (
                  <>
                    <img src={receiptImage} alt="Biên lai thanh toán" className="preview-uploaded-image" />
                    <span className="btn-browse-file">Thay đổi ảnh biên lai khác</span>
                  </>
                ) : (
                  <>
                    <div className="dropzone-icon-circle">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    </div>
                    <strong className="dropzone-main-text">Tải ảnh chuyển khoản (Ủy nhiệm chi)</strong>
                    <p className="dropzone-sub-text">
                      Nhấp để duyệt ảnh từ thiết bị hoặc kéo thả biên lai ngân hàng của bạn vào đây
                    </p>
                    <span className="btn-browse-file">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Chọn file từ máy
                    </span>
                  </>
                )}
              </label>
            </section>
          </div>

          {/* CỘT PHẢI: Thông tin lịch đặt & Tổng tiền */}
          <aside className="right-order-column">
            <div className="order-summary-card">
              <div className="summary-header">
                <div className="header-left-title">
                  <svg className="icon-box" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <h3 className="title">Thông tin lịch đặt</h3>
                </div>
                <span className="badge-pending">Chờ thanh toán</span>
              </div>

              <div className="info-list-group">
                {/* Khách hàng */}
                <div className="info-item-row">
                  <div className="item-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="item-body">
                    <span className="item-label">Khách hàng</span>
                    <strong className="item-val-strong">{bookingData.customerName || user?.name || '—'}</strong>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="info-item-row">
                  <div className="item-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="item-body">
                    <span className="item-label">Số điện thoại</span>
                    <strong className="item-val-strong">{bookingData.phone || user?.phone || '—'}</strong>
                  </div>
                </div>

                {/* Mã đơn đặt */}
                <div className="info-item-row">
                  <div className="item-icon-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="item-body">
                    <span className="item-label">Mã đơn đặt</span>
                    <strong className="item-val-strong">{bookingCode}</strong>
                  </div>
                  <span className="badge-category-right">{courtCategory}</span>
                </div>

                {/* Chi tiết lịch thi đấu */}
                <div className="info-item-row">
                  <div className="item-icon-circle" style={{ backgroundColor: '#059669', color: '#ffffff' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="item-body">
                    <span className="item-label">Chi tiết lịch thi đấu</span>
                    <strong className="item-val-strong">
                      {playDate} • {timeSlot}
                    </strong>
                    <div className="item-sub-tag">
                      📍 {courtName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="summary-price-divider"></div>

              {/* Bảng giá */}
              <div className="price-breakdown-box">
                <div className="price-row">
                  <div className="label-with-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                    </svg>
                    <span>Tiền thuê sân</span>
                  </div>
                  <span className="price-number">{totalCourtPrice.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="price-row">
                  <div className="label-with-icon"><span>Dịch vụ bổ sung</span></div>
                  <span className="price-number">{totalServicePrice.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="divider-dashed"></div>

                <div className="total-pay-row">
                  <div className="total-label-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                    <div>
                      <span className="main-label">Cần thanh toán</span>
                      <span className="sub-note">Trả đủ 100% để giữ sân</span>
                    </div>
                  </div>
                  <div className="grand-total-amount">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div className="instant-verify-notice">
                <svg className="bolt-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
                </svg>
                <span>
                  Sau khi xác nhận, bạn sẽ tiếp tục thanh toán trên cổng VNPay. Trạng thái đơn sẽ được cập nhật tự động.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. Thanh Dock hành động cố định chân trang */}
      <div className="bottom-action-dock">
        <div className="dock-inner-container">
          <div className="dock-left-price">
            <span className="price-caption">Thanh toán: Tiền sân</span>
            <div className="price-total-flex">
              <span className="total-label">Tổng thanh toán:</span>
            <span className="total-figure">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-confirm-transfer"
            onClick={handleConfirmTransfer}
            disabled={isSubmitting || isLoadingPrice || countdown <= 0 || !bookingData}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>{isSubmitting ? 'Đang chuyển tới VNPay...' : 'Thanh toán qua VNPay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
