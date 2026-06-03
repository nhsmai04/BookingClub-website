import { use, useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  User, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  Calendar, 
  History, 
  PlusCircle, 
  Download, 
  Eye, 
  ChevronLeft,
  Smartphone,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence, color } from "framer-motion";
import './ManagementPage.scss';
import type { Booking } from '../../services/booking.api';
import {  createVnpayPaymentApi, getBookingOfUserApi, getNextBookingOfUserApi } from '../../services/booking.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from "react-router";
import  Modal  from '../../components/common/Modal/Modal.tsx';
import { ReviewForm } from '../../features/Review/ReviewForm.tsx';
import type { CreateReviewPayload } from '../../services/review.api';
import type { GetReviewOfBookingResponse, FilterOption, GetBookingStatsResponse } from '../../services/booking.api';
import type { UpdateReviewPayload } from '../../services/review.api';
import { createReviewApi, updateReviewApi} from '../../services/review.api';
import { getReviewOfBookingApi } from '../../services/booking.api';
import moment from 'moment';
import SideBar from '../../components/common/SideBar/SideBar.tsx';
moment.locale('vi');
const ManagementPage = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedReview, setSelectedReview] = useState<GetReviewOfBookingResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('Tất cả');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBookingStat, setActiveBookingStat] = useState<GetBookingStatsResponse | null>(null);
  const [confirmedBookingStat, setConfirmedBookingStat] = useState<GetBookingStatsResponse | null>(null);
  
  // Tạo hiệu ứng delay gõ chữ
  useEffect(() => {
    const handler = setTimeout(() => {
    setDebouncedSearch(searchQuery);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, 400); // Sau khi dừng gõ 400ms mới bắt đầu call API

  return () => clearTimeout(handler);
}, [searchQuery]);
  
  useEffect(()  => {
    fetchBookings();
    fetchBookingStats();
  }, [pagination.page, filter, debouncedSearch]);

  useEffect(() => {
    fetchBookingStats();
  }, []);

  const fetchBookings = async () => {
    try {
      const result = await getBookingOfUserApi(searchQuery, filter, pagination.page, pagination.limit);
      setBookings(result.data || [] );
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      // Chạy song song cả 2 request lên server cùng một lúc
    const [activeStats, confirmedStats] = await Promise.all([
      getNextBookingOfUserApi('active'),
      getNextBookingOfUserApi('completed') // Lưu ý: Ở backend bạn viết logic là 'completed', nên truyền 'completed' nhé!
    ]);
      setActiveBookingStat(activeStats);
      setConfirmedBookingStat(confirmedStats);
    } catch (error) {
      console.error("Failed to fetch booking stats:", error);
    }
  };
  const goPrevPage = () => {
    if(pagination.page === 1) return;
    
    setPagination(prev => ({
      ...prev,
      page: prev.page - 1,
    }));
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({
      ...prev,
      page,
    }));
  };

  const goNextPage = () => {
    if(pagination.page === pagination.totalPages) return;
    setPagination(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  // Ham thay doi filter Log
  const handleFilterChange = async (opt: FilterOption) => {
    setFilter(opt);
    setIsLoading(true);
  }


  // Ham mo modal review
  const handleOpenReviewModal = async (booking: Booking) => {
    try{
    const reviewData = await getReviewOfBookingApi(booking._id);
    setSelectedReview(reviewData);
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
    }catch(error) {
      console.error("Failed to fetch review for booking:", error);
      setSelectedReview(null); 
    }
  };

  // Ham dong modal review

  const handleCloseReviewModal = () => {
    setSelectedBooking(null);
    setIsReviewModalOpen(false);
    setSelectedReview(null); // Reset review khi đóng modal để tránh hiển thị dữ liệu cũ khi mở modal khác
  };

  // Ham submit review
  const handleSubmitReview = async (data: { rating: number; comment: string }) => {
    try {
      if (!selectedBooking) {
        alert("No booking selected for review!");
        return;
      }
      if(selectedReview) {
        // Nếu đã có review rồi thì gọi API cập nhật review (nếu backend có hỗ trợ)
        const payload: UpdateReviewPayload ={
          rating: data.rating,
          comment: data.comment,
        }
        await updateReviewApi( selectedReview._id, payload );
        alert("Review updated successfully");
        handleCloseReviewModal();
        return;
      }
      // Implementation for submitting review
      const payload: CreateReviewPayload = {
        booking_id: selectedBooking?._id || "",
        rating: data.rating,
        comment: data.comment,
      };
      await createReviewApi(payload);
      alert("Review submitted successfully");
      handleCloseReviewModal();
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  // Ham thanh toan
  const handlePayment = async (bookingId: string) => {
    try {
      // Implementation for payment
       const paymentRes = await createVnpayPaymentApi(bookingId);
       window.location.href = paymentRes.paymentUrl; 
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };
  
  // Ham xem chi tiet booking
  const handleViewDetails = (booking: Booking) => {
    navigate(`/booking-detail/${booking._id}`,
      {
        state: {
          bookingData: booking,
        }
      }
    );
    
  }
    return (
      <div className="management-page">
        <div className="app-container">
       {/* Sidebar Navigation */}
      <SideBar />

        {/* Main Content Area */}
        <main className="dashboard-content">
          <Modal isOpen={isReviewModalOpen} onClose={handleCloseReviewModal}>
            {selectedBooking && (
              <ReviewForm 
                key={selectedReview?. _id || "new-review"} // Đảm bảo form reset khi booking khác được chọn
                courtName={selectedBooking?.complex_id?.name || ""} 
                onCancel={handleCloseReviewModal} 
                onSubmit={handleSubmitReview}
                data = {selectedReview}
              />
            )}
          </Modal>

            {/* Top App Bar */}
        <header className="top-header">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm lịch sử..."
              value={searchQuery}
              onChange={
                (e) => {
                setSearchQuery(e.target.value);
                setPagination(prev => ({
                  ...prev,
                  page: 1, // Reset về trang 1 mỗi khi thay đổi từ khóa tìm kiếm
                }));
                }}
              className="search-input"
            />
          </div>

          <div className="header-actions">
            <div className="action-buttons">
              <button className="icon-btn">
                <Bell size={20} />
                <span className="notification-badge"></span>
              </button>
              <button className="icon-btn">
                <HelpCircle size={20} />
              </button>
            </div>

          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">Lịch sử đặt sân</span>
        </div>

         {/* Header */}
        <div className="page-header">
          <h2 className="page-title">Lịch sử đặt sân</h2>
          <p className="page-desc">Theo dõi lịch đặt sân của bạn trong quá khứ và sắp tới.</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stats-card stats-card-accent"
          >
            <div className="card-bg-circle" />
            <div className="stats-content">
              <p className="stats-label">Tổng số đơn đang chờ chơi</p>
              <h3 className="stats-value">{activeBookingStat?.totalBookings || 0}</h3>
              <div className="stats-meta">
                <Calendar size={16} />
                <span>  Next: {
    activeBookingStat?.booking?.nearest_time_slot
      ? `${activeBookingStat.booking.nearest_time_slot.start_time} - ${moment
          .utc(activeBookingStat.booking.nearest_time_slot.play_date)
          .local()
          .format("DD/MM/YYYY")}`
      : "Không có đơn sắp tới"
  }
</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stats-card stats-card-gray"
          >
            <div className="card-bg-circle" />
            <div className="stats-content">
              <p className="stats-label">Tổng số đơn đã hoàn thành</p>
              <h3 className="stats-value">{confirmedBookingStat?.totalBookings || 0}</h3>
              <div className="stats-meta">
                <History size={16} />
                <span>  Last : {
    confirmedBookingStat?.booking?.nearest_time_slot
      ? `${confirmedBookingStat.booking.nearest_time_slot.start_time} - ${moment
          .utc(confirmedBookingStat.booking.nearest_time_slot.play_date)
          .local()
          .format("DD/MM/YYYY")}`
      : "Không có đơn đã hoàn thành"
  }
</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="promo-card"
          >
            {/* <img 
              src="https://images.unsplash.com/photo-1541250848049-b4f71413cc30?q=80&w=600&auto=format&fit=crop" 
              className="promo-bg-img"
              alt="Tennis court"
              referrerPolicy="no-referrer"
            /> */}
            <div className="promo-content">
              <p className="promo-tag">Ready for a match?</p>
              <h3 className="promo-title">Đặt sân nhanh</h3>
              <button className="quick-book-btn" onClick={() => navigate('/complexes/search')}>
                <PlusCircle size={18} />
                Quick Book
              </button>
            </div>
          </motion.div>
        </div>

        {/* Booking Table Section */}
        <section className="content-section">
          <div className="section-header">
            <div className="section-title-group">
              <h4 className="section-title">Booking Logs</h4>
              <div className="filter-tabs">
                {(['Tất cả', 'Hoàn thành', 'Khác'] as FilterOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleFilterChange(opt)}
                    className={`filter-tab ${
                      filter === opt ? 'filter-tab-active' : 'filter-tab-inactive'
                    }`}
                    disabled={isLoading}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button className="download-btn">
              <Download size={14} />
              Download PDF Report
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sport</th>
                  <th>Tên Sân</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
  <AnimatePresence>
    {isLoading ? (
      /* Trường hợp 1: Đang tải dữ liệu - Hiển thị hiệu ứng loading bên trong bảng */
    <tr>
      <td colSpan={6} className="text-center py-8">
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Hiệu ứng xoay tròn (Spinner) bằng CSS thuần Tailwind */}
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Đang tải danh sách đặt sân...</p>
        </div>
      </td>
    </tr>
    ) : bookings && bookings.length > 0 ? (
      /* Trường hợp 2: Dữ liệu đã tải xong và có booking - Hiển thị danh sách booking */
     bookings.map((booking, idx) => (
      <motion.tr
        key={booking._id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        {/* Sport */}
        <td className="font-semibold">
          Unknown
        </td>

        {/* Tên sân */}
        <td>
          <p className="font-semibold text-sm">
            {booking.complex_id?.name}
          </p>

          <p className="text-xs">
            Booking ID: {booking._id}
          </p>
        </td>

        {/* Ngày đặt */}
        <td>
          <p className="font-semibold text-sm">
            {new Date(booking.booking_date).toLocaleDateString("vi-VN")}
          </p>
        </td>

        {/* Status */}
        <td>
          <span
            className={`status-pill ${
              booking.status === "confirmed"
                ? "status-confirmed"
                : booking.status === "completed"
                ? "status-completed"
                : booking.status === "pending"
                ? "status-pending"
                : "status-cancelled"
            }`}
          >
            {booking.status}
          </span>
        </td>

        {/* Price */}
        <td>
          <span
            className={
              booking.status === "cancelled"
                ? "price-canceled"
                : "price-active"
            }
          >
            {Number(
              booking.total_price.$numberDecimal
            ).toLocaleString("vi-VN")}
            đ
          </span>
        </td>

        {/* Actions */}
        <td className="text-right">
          <div className="row-actions">
            <button 
            className="action-eye-btn"
            onClick={() => handleViewDetails(booking)}
            >
              <Eye size={16} />
            </button>

          {
            booking.status === "completed" ? (
              <button className="action-review-btn" onClick={() => handleOpenReviewModal(booking)}>
                Review
              </button>
            ) : booking.status === "pending" ? (
              <button className="action-payment-btn " onClick={() => handlePayment(booking._id)}>
                Make Payment
              </button>
            ) : null
          }
            
          </div>
        </td>
      </motion.tr>
    ))) : (
      // Trường hợp 3: Dữ liệu đã tải xong nhưng không có booking nào - Hiển thị thông báo trống
      <tr>
      <td colSpan={6} className="text-center py-8 text-gray-500">
        Không tìm thấy lịch sử đặt sân nào ở trạng thái này.
      </td>
      </tr>
    )}
  </AnimatePresence>
</tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="pagination">
            <p className='text-xs font-medium'>
              Showing {bookings.length} of {pagination.total} bookings
            </p>
            <div className="pagination-controls">
                  <button 
                  className="page-arrow" 
                  disabled={pagination.page === 1}
                  onClick={goPrevPage}
                >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: pagination.totalPages }).map((_,idx) => (
                    <button
                      key={idx + 1}
                      className={`page-num ${pagination.page === idx + 1 ? 'page-num-active' : 'page-num-inactive'}`}
                      onClick={() => goToPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button 
                    className="page-arrow"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={goNextPage}
                  >
                    <ChevronRight size={16} />
                  </button>
            </div>
          </div>
        </section>

        {/* Promo Grid */}
        <div className="promo-grid">
          <div className="promo-item">
            <img 
              src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=200&auto=format&fit=crop" 
              className="promo-item-img"
              alt="Reward Program"
              referrerPolicy="no-referrer"
            />
            <div className="promo-item-content">
              <h5 className="promo-item-title">Join our Reward Program</h5>
              <p className="promo-item-desc">Earn points for every hour you play and unlock exclusive discounts.</p>
              <button className="learn-more-btn">
                Learn More
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="promo-item">
            <div className="promo-item-icon-box">
              <Smartphone size={40} />
            </div>
            <div className="promo-item-content">
              <h5 className="promo-item-title">Download the App</h5>
              <p className="promo-item-desc">Get instant notifications for your bookings and digital passes.</p>
              <div className="store-buttons">
                <button className="store-btn">App Store</button>
                <button className="store-btn">Google Play</button>
              </div>
            </div>
          </div>
        </div>
        {/* Floating Action Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fab"
        >
          <Plus size={32} />
          <span className="fab-tooltip">New Booking</span>
        </motion.button>

        </main>

        </div>
      </div>
    
  );
}

export default ManagementPage;