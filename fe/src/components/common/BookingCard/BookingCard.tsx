import React, { useState, useEffect } from "react";
import "./BookingCard.css";
import { useNavigate, useParams } from 'react-router-dom';
import {getTimeSlot} from "../../../services/sportDetail.api";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES ---
interface TimeSlot {
  time: string;
  isOccupied: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: 'hour' | 'flat';
}

interface PricingRule {
  rule_name: string;
  day_of_week: string[];
  start_hour: string;
  end_hour: string;
  price_multiplier: number;
  priority: number;
}

interface CourtOption {
  id: string;
  name: string;
  sportType: string;
  minDuration: number;
  slotStep: number;
  basePrice: number;
  pricingRules: PricingRule[];
}

interface BookingCardProps {
  complexId: string;
  complexName: string;
  courtsList: CourtOption[];
  courtId?: string;
  onClearSelection: () => void;
}

interface CartItem {
  courtName: string;
  sportType: string;
  basePrice: number;
  slots: string[];
  services: string[];
  date: string;
}

const getDurationInMinutes = (slotRange: string): number => {
  const [start, end] = slotRange.split(" - ");
  if (!start || !end) return 0;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

const getDurationInHours = (slotRange: string): number => {
  return getDurationInMinutes(slotRange) / 60;
};

const getHoursBetween = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
};

const availableServices: ServiceItem[] = [
  { id: "referee", name: "Thuê trọng tài", price: 200000, unit: "hour" },
  { id: "racket", name: "Thuê vợt", price: 200000, unit: "flat" },
  { id: "ballboy", name: "Thuê nhặt banh", price: 50000, unit: "hour" },
];

const BookingCard: React.FC<BookingCardProps> = ({
  complexId,
  complexName,
  courtsList,
  courtId,
  onClearSelection
}) => {
  const [courtDetail, setCourtDetail] = useState<any>(null); // Chứa: tên sân, loại thể thao, giá base
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(courtId || "")
  const [cart, setCart] = useState<Record<string, CartItem>>(() => {
    const savedCart = sessionStorage.getItem('bookingCart');
    return savedCart ? JSON.parse(savedCart) : {};
  });
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const savedDate = sessionStorage.getItem('bookingDate');
    return savedDate || new Date().toISOString().split('T')[0];
  });

  const minRequired = courtDetail?.minDuration || 60;
  const navigate = useNavigate();

  //Lưu giỏ hàng
  useEffect(() => {
    sessionStorage.setItem('bookingCart', JSON.stringify(cart));
  }, [cart]);

  // Lưu ngày đang chọn mỗi khi có thay đổi
  useEffect(() => {
    sessionStorage.setItem('bookingDate', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (courtId) setSelectedCourtId(courtId || "");
  }, [courtId]);

  useEffect(() => {
    setCart({});
  }, [complexId]);

  //Fetch dữ liệu từ BE 
  useEffect(() => {
    if (!selectedCourtId) {
      setCourtDetail(null);
      setAvailableSlots([]);
      return;
    }

    setCourtDetail(null);
    setAvailableSlots([]);

    let isCurrentRequest = true;

    const syncDataWithBackend = async () => {
      setIsLoading(true);
      try {
        const response = await getTimeSlot({
          subfield_id: selectedCourtId,
          playDate: selectedDate
        });

        if (isCurrentRequest) {
          const slotDetails = response?.timeSlots || [];
          const slots = slotDetails.map((s: any) => ({
            time: s.time,
            isOccupied: s.status.toLowerCase() !== "available"
          }));
          setAvailableSlots(slots);
          setCourtDetail(courtsList.find(c => String(c.id) === String(selectedCourtId)));
        }
      } catch (error) {
        setAvailableSlots([]);
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }

    syncDataWithBackend();
    return () => { isCurrentRequest = false; };
  }, [selectedCourtId, selectedDate]);

  const cartItemKey = (selectedCourtId && selectedDate) ? `${selectedCourtId}-${selectedDate}` : "";
  const currentActiveSlots = cartItemKey ? (cart[cartItemKey]?.slots || []) : [];
  const currentActiveServices = cartItemKey ? (cart[cartItemKey]?.services || []) : [];

  const handleToggleSlot = (slotTime: string, isOccupied: boolean) => {
    if (isOccupied || !selectedCourtId || !courtDetail) return;

    setCart(prev => {
      const courtCart = prev[cartItemKey] || {
        courtName: courtDetail.name,
        sportType: courtDetail.sportType,
        basePrice: courtDetail.basePrice,
        slots: [],
        services: [],
        date: selectedDate
      };
      const hasSlot = courtCart.slots.includes(slotTime);
      const newSlots = hasSlot
        ? courtCart.slots.filter(s => s !== slotTime)
        : [...courtCart.slots, slotTime].sort();

      if (newSlots.length === 0 && courtCart.services.length === 0) {
        const newCart = { ...prev };
        delete newCart[cartItemKey];
        return newCart;
      }

      return { ...prev, [cartItemKey]: { ...courtCart, slots: newSlots, date: selectedDate } };
    });
  };

  const handleToggleService = (serviceId: string) => {
    if (!selectedCourtId || !courtDetail) return;

    setCart(prev => {
      if (!prev[cartItemKey]) {
        alert("Vui lòng chọn giờ chơi trước khi thêm dịch vụ!");
        return prev;
      }

      const courtCart = prev[cartItemKey];
      const hasService = courtCart.services.includes(serviceId);
      const newServices = hasService
        ? courtCart.services.filter(s => s !== serviceId)
        : [...courtCart.services, serviceId];

      return { ...prev, [cartItemKey]: { ...courtCart, services: newServices } };
    });
  };

  const handleRemoveCartItem = (idToRemove: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[idToRemove];
      return newCart;
    });
    if (idToRemove === selectedCourtId && onClearSelection) {
      onClearSelection();
    }
  };


  // Xác định giá
  const getPriceForSlot = (timeStr: string, dateStr: string, basePrice: number, rules: any[]) => {
    // Xác định thứ trong tuần
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(dateStr));

    // Chuyển giờ slot hiện tại sang phút để so sánh
    const [h, m] = timeStr.split(':').map(Number);
    const currentMins = h * 60 + m;

    // Tìm các rules khớp với ngày và giờ
    const activeRules = rules.filter(rule => {
      const isRightDay = rule.day_of_week.includes(dayOfWeek);
      const [startH, startM] = rule.start_hour.split(':').map(Number);
      const [endH, endM] = rule.end_hour.split(':').map(Number);

      return isRightDay && currentMins >= (startH * 60 + startM) && currentMins < (endH * 60 + endM);
    });

    // Ưu tiên Rule có priority cao nhất
    if (activeRules.length > 0) {
      const bestRule = activeRules.reduce((prev, curr) => (curr.priority > prev.priority) ? curr : prev);
      return basePrice * bestRule.price_multiplier;
    }

    return basePrice;
  };

  let globalTotalPrice = 0;
  let totalSelectedCourts = 0;

  Object.keys(cart).forEach(id => {
    const item = cart[id];
    if (item.slots.length === 0) return;

    totalSelectedCourts += 1;

    // Lấy thông tin sân courtsList
    const courtIdInCart = id.split('-')[0]; // Tách ID từ key "ID-Date"
    const courtInfo = courtsList.find(c => c.id === courtIdInCart);
    const itemPricingRules = courtInfo?.pricingRules || [];

    // Tính tiền sân
    const courtCost = item.slots.reduce((sum, slotRange) => {
      const slotStartTime = slotRange.split(' - ')[0];
      const priceAtThisTime = getPriceForSlot(
        slotStartTime,
        item.date,
        item.basePrice,
        itemPricingRules
      );
      return sum + (priceAtThisTime * getDurationInHours(slotRange));
    }, 0);

    // Tính tiền dịch vụ dựa trên tổng giờ 
    const hours = item.slots.reduce((sum, slotRange) => sum + getDurationInHours(slotRange), 0);

    const servicesCost = item.services.reduce((sum, sId) => {
      const s = availableServices.find(x => x.id === sId);
      if (!s) return sum;
      return sum + (s.unit === 'hour' ? s.price * hours : s.price);
    }, 0);

    globalTotalPrice += (courtCost + servicesCost);
  });

  const handlePayment = () => {
    const formattedBookingDetails: any[] = [];

    Object.keys(cart).forEach(courtId => {
      const item = cart[courtId];
      if (item.slots.length === 0) return;

      const sortedSlots = [...item.slots].sort();
      const actualCourtId = courtId.split('-')[0];

      // Khởi tạo block đầu tiên
      let currentBlock = {
        sub_field_id: actualCourtId,
        courtName: item.courtName, // THÊM: Tên sân để hiển thị Checkout
        startTime: sortedSlots[0].split(' - ')[0],
        endTime: sortedSlots[0].split(' - ')[1],
        slotCount: 1, // Đếm số slot (30p) để tính tiền
        playDate: item.date
      };

      const courtBlocks = [];

      // Logic gộp các giờ liền kề
      for (let i = 1; i < sortedSlots.length; i++) {
        const [nextStart, nextEnd] = sortedSlots[i].split(' - ');

        if (currentBlock.endTime === nextStart) {
          currentBlock.endTime = nextEnd;
          currentBlock.slotCount++;
        } else {
          courtBlocks.push({ ...currentBlock });
          currentBlock = {
            sub_field_id: actualCourtId,
            courtName: item.courtName,
            startTime: nextStart,
            endTime: nextEnd,
            slotCount: 1,
            playDate: item.date
          };
        }
      }
      courtBlocks.push(currentBlock);

      // Map giá tiền và dịch vụ cho từng Block
      courtBlocks.forEach((block, index) => {
        const blockHours = getHoursBetween(block.startTime, block.endTime);
        const courtInfo = courtsList.find(c => String(c.id) === String(block.sub_field_id));
        const blockPrice = getPriceForSlot(
          block.startTime,
          block.playDate,
          item.basePrice,
          courtInfo?.pricingRules || []
        ) * blockHours;
        let detailedServices: any[] = [];

        // Gắn dịch vụ vào tất cả các block
        if (item.services.length > 0) {
          detailedServices = item.services.map(sId => {
            const s = availableServices.find(x => x.id === sId);
            let sPrice = 0;

            if (s) {
              if (s.unit === 'hour') {
                // Dịch vụ tính theo giờ (Trọng tài): Tính theo số giờ của riêng block này
                sPrice = s.price * blockHours;
              } else if (s.unit === 'flat') {
                // Dịch vụ cố định (Thuê vợt): Chỉ tính tiền ở block đầu tiên, block sau giá 0đ
                sPrice = index === 0 ? s.price : 0;
              }
            }
            return { id: sId, name: s?.name || sId, price: sPrice };
          });
        }

        formattedBookingDetails.push({
          sub_field_id: block.sub_field_id,
          courtName: block.courtName,
          startTime: block.startTime,
          endTime: block.endTime,
          price: blockPrice,
          services: detailedServices,
          playDate: block.playDate
        });
      });
    });

    const bookingPayload = {
      complex_id: complexId,
      booking_date: selectedDate,    
      total_price: globalTotalPrice,
      booking_details: formattedBookingDetails,
      slug: slug
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
    sessionStorage.removeItem('bookingCart');

    // Reset Card
    setCart({});
    setSelectedCourtId("");
    setCourtDetail(null);
    navigate(`/complexes/${bookingPayload.complex_id}/booking/confirm`, {
      state: {
        bookingData: bookingPayload,
      },
    });
  };

  // Xử lý 'đổ ngược dữ liệu' từ Hóa đơn -> BookingCard
  const handleEditCartItem = (cartKey: string) => {
    const item = cart[cartKey];
    if (!item) return;

    // Tách courtId từ cartKey (ví dụ: "PB_001-2023-10-20" -> "PB_001")
    const [cId] = cartKey.split('-');

    // Cập nhật các State để UI thay đổi
    setSelectedCourtId(cId);
    setSelectedDate(item.date);
  };

  // 1. Tính tổng số phút đã chọn cho sân hiện tại
  const totalMinutesSelected = currentActiveSlots.reduce(
    (total, slotRange) => total + getDurationInMinutes(slotRange),
    0
  );
  // 2. Kiểm tra xem đã đủ thời gian tối thiểu chưa
  // Chỉ kiểm tra khi đã bắt đầu chọn ít nhất 1 ô
  const isUnderMinDuration = currentActiveSlots.length > 0 && totalMinutesSelected < minRequired;

  return (
    <div className="booking-card-container">
      <div className="booking-card-header">
        <div className="booking-card-header-info">
          <span className="booking-complex-name"> {complexName}</span>
          <h2 className="booking-card-title">Đặt sân</h2>
        </div>
        <button className="booking-clear-btn" onClick={onClearSelection}>Đóng</button>
      </div>

      <hr className="booking-divider" />


      <div className="booking-section">
        <div className="date-picker-wrapper">
          <p className="booking-section-title" style={{ marginBottom: 0 }}>Ngày chơi:</p>
          <input
            type="date"
            className="date-picker-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="sub-field-picker-wrapper">
          <p className="booking-section-title" style={{ marginBottom: 0 }}>Chọn sân:</p>
          <select
            className="sub-field-picker-input"
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
          >
            <option value="">----Chọn sân----</option>

            {courtsList.map((court) => (
              <option key={court.id} value={court.id}>{court.name}</option>
            ))}
          </select>
        </div>

        <div className="sub-field-picker-wrapper">
          <p className="booking-section-title">Loại sân:</p>
          <div className={`booking-field-value ${!courtDetail ? "loading-placeholder" : ""}`}>
            {courtDetail ? courtDetail.sportType : "..."}
          </div>
        </div>
      </div>

      <hr className="booking-divider" />


      <div className="booking-section">
        <h4 className="booking-section-title time">Chọn khung giờ chi tiết</h4>
        <div className={`booking-section-note ${isUnderMinDuration ? "warning-text" : "note"}`}>
          {isUnderMinDuration ? (
            <span className="error-msg">
              Bạn cần chọn thêm để đủ thời gian tối thiểu {minRequired} phút (Hiện tại: {totalMinutesSelected}p)
            </span>
          ) : ("")}
        </div>

        <div className="time-grid-scroll-container"
          style={{
            opacity: isLoading ? 0.6 : 1,
            pointerEvents: isLoading ? 'none' : 'auto', 
            transition: 'opacity 0.15s ease-in-out'
          }}
        >
          {isLoading ? (
            <div className="time-pill-grid shimmer-container">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="time-pill shimmer-pill"></div>
              ))}
            </div>
          ) : (
          <div className="time-pill-grid">
            {availableSlots.map((slot) => {
              const isSelected = currentActiveSlots.includes(slot.time);
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-pill ${isSelected ? "active" : ""} ${slot.isOccupied ? "occupied" : ""}`}
                  onClick={() => handleToggleSlot(slot.time, slot.isOccupied)}
                  disabled={isLoading || slot.isOccupied}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
          )}
        </div>
      </div>

      <hr className="booking-divider" />


      {availableServices.length > 0 && (
        <div className="booking-section">
          <h4 className="booking-section-title">Dịch vụ tiện ích</h4>
          {availableServices.map((service) => (
            <div className="service-row" key={service.id}>
              <div className="service-info">
                <span className="service-name">{service.name}</span>
                <span className="service-price">
                  +{service.price.toLocaleString("vi-VN")}k {service.unit === 'hour' ? '/h' : '(Cố định)'}
                </span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={currentActiveServices.includes(service.id)}
                  onChange={() => handleToggleService(service.id)}
                  disabled={currentActiveSlots.length === 0}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="booking-footer-box">
        <h4 className="mini-cart-title">Hóa đơn</h4>

        <div className="mini-cart-list">
          <AnimatePresence mode="popLayout">
            {Object.keys(cart)
            .map(id => {
              const item = cart[id];
              if (item.slots.length === 0) return null;

              const courtIdInCart = id.split('-')[0];
              const currentCourtData = courtsList.find(c => c.id === courtIdInCart);

              const itemCourtCost = item.slots.reduce((total, slotRange) => {
                const slotTime = slotRange.split(' - ')[0];
                const priceAtThisTime = getPriceForSlot(
                  slotTime,
                  item.date,
                  item.basePrice,
                  currentCourtData?.pricingRules || []
                );
                return total + (priceAtThisTime * getDurationInHours(slotRange));
              }, 0);

              const itemServicesCost = item.services.reduce((sum, sId) => {
                const s = availableServices.find(x => x.id === sId);
                if (!s) return sum;
                const hours = item.slots.reduce((total, slotRange) => total + getDurationInHours(slotRange), 0);
                return sum + (s.unit === 'hour' ? s.price * hours : s.price);
              }, 0);

              const itemTotalPrice = itemCourtCost + itemServicesCost;

              const isEditing = id === `${selectedCourtId}-${selectedDate}`;

              return (
                <motion.button 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`mini-cart-item ${isEditing ? 'is-editing' : ''}`}
                  key={id}
                  onClick={() => handleEditCartItem(id)}
                >

                  <div className="mini-cart-item-header">
                    <span className="mini-cart-court-name">
                      {isEditing && "✏️ "}
                      {item.courtName} ({item.sportType})
                    </span>
                    <button className="remove-item-btn" onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCartItem(id)
                    }}
                      title="Xóa sân này">✕</button>
                  </div>

                  <div className="mini-cart-item-details">
                    <div className="info-row">
                      <span className="info-label">Ngày đặt:</span>
                      <span className="info-value">{item.date.split('-').reverse().join('/')}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Thời gian:</span>
                      <span className="info-value">{item.slots.join(', ')}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Tổng thời gian:</span>
                      <span className="info-value">
                        {item.slots.reduce((total, slotRange) => total + getDurationInHours(slotRange), 0)} giờ
                      </span>
                    </div>

                    {item.services.length > 0 && (
                      <div className="info-row">
                        <span className="info-label">Dịch vụ:</span>
                        <span className="info-value service-list">
                          {item.services.map(sId => availableServices.find(s => s.id === sId)?.name).join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="info-row price-row-item">
                      <span className="info-label">Giá:</span>
                      <span className="info-value price-highlight">{itemTotalPrice.toLocaleString()}đ</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="total-price-row">
          <span className="total-label">Tổng tiền ước tính({totalSelectedCourts} sân):</span>
          <span className="total-amount">{globalTotalPrice.toLocaleString("vi-VN")}đ</span>
          <span className="total-note note">Lưu ý: Giá sân có thể thay đổi vào các ngày cuối tuần hoặc ngày lễ</span>
        </div>

        <button
          className="booking-pay-btn"
          onClick={handlePayment}
          disabled={isUnderMinDuration || totalSelectedCourts === 0}
          style={{
            backgroundColor: isUnderMinDuration ? "#ccc" : "",
            cursor: isUnderMinDuration ? "not-allowed" : "pointer"
          }}>
          {isUnderMinDuration ? "Chưa đủ thời gian tối thiểu" : "Thanh toán ngay"}
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
