import Booking from "../models/booking.model.js";
import BookingDetails from "../models/booking_details.model.js";
import Payment from "../models/payment.model.js";
import SubField from "../models/sub_field.model.js";
import FieldTypeConfig from "../models/field_type_configs.model.js";
import mongoose from "mongoose";
import { CalculatePrice } from "./subfield.service.js";
import SportComplex from "../models/sport_complex.model.js";
import FieldImage from "../models/field_image.model.js";
import { generateQR } from "../utils/qrcode.js";
import dayjs from "dayjs";
import TimeSlot from "../models/time_slot.model.js"
const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }

  return h * 60 + m;
};
export const createBooking = async (userId, payload) => {
  const { complex_id, booking_date, booking_details } = payload;

  if (!complex_id) {
    throw new Error("complex_id is required");
  }

  if (!booking_date) {
    throw new Error("booking_date is required");
  }

  if (!booking_details || booking_details.length === 0) {
    throw new Error("Booking details are required");
  }

  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {

      const detailsToInsert = [];

      let totalPrice = 0;

      for (const item of booking_details) {
        if (!item.sub_field_id) {
          throw new Error("sub_field_id is required");
        }

        if (!item.play_date) {
          throw new Error("play_date is required");
        }

        if (!item.startTime || !item.endTime) {
          throw new Error("startTime and endTime are required");
        }

        if (!mongoose.Types.ObjectId.isValid(item.sub_field_id)) {
          throw new Error("Invalid sub_field_id");
        }

        const subField = await SubField.findOne({
          _id: item.sub_field_id,
          complex_id,
        }).session(session);

        if (!subField) {
          throw new Error("Sub field not found");
        }

        const config = await FieldTypeConfig.findOne({
          _id: subField.config_id,
          is_active: true,
        }).session(session);

        if (!config) {
          throw new Error("Field type config not found");
        }

        const start = timeToMinutes(item.startTime);
        const end = timeToMinutes(item.endTime);

        if (end <= start) {
          throw new Error("Invalid booking time");
        }

        const duration = end - start;

        if (duration < config.min_duration) {
          throw new Error("Duration is shorter than minimum duration");
        }

        if (duration % config.slot_step !== 0) {
          throw new Error("Invalid slot step");
        }

        const existedDetails = await BookingDetails.find({
          sub_field_id: item.sub_field_id,
          play_date: item.play_date,
        })
          .populate({
            path: "booking_id",
            select: "status",
          })
          .session(session);

        for (const existed of existedDetails) {
          if (!existed.booking_id) continue;

          if (existed.booking_id.status === "cancelled") {
            continue;
          }

          const existedStart = timeToMinutes(existed.start_time);
          const existedEnd = timeToMinutes(existed.end_time);

          const isOverlap =
            start < existedEnd && end > existedStart;

          if (isOverlap) {
            throw new Error(
              `Time slot already booked: ${item.startTime} - ${item.endTime}`
            );
          }
        }

        const price = await CalculatePrice(item.sub_field_id, item.play_date, item.startTime, item.endTime);

        totalPrice += price;

        detailsToInsert.push({
          sub_field_id: item.sub_field_id,
          play_date: item.play_date,
          price: price,
          start_time: item.startTime,
          end_time: item.endTime,
        });
      }

      const [booking] = await Booking.create([{
        user_id: userId,
        complex_id,
        booking_date,
        total_price: totalPrice,
        status: "pending",
      }],
        { session }
      );

      const bookingDetails = detailsToInsert.map((item) => ({
        ...item,
        booking_id: booking._id,
      }));

      await BookingDetails.insertMany(bookingDetails, {
        session,
      });

      // 3. Create locked time slots
      const timeSlotsToInsert = booking_details.map((detail) => (
        {
          sub_field_id: detail.sub_field_id,

          booked_date: dayjs(detail.play_date)
            .startOf("day")
            .toDate(),

          time: `${detail.startTime} - ${detail.endTime}`,

          status: "Locked"
        })
      );

      await TimeSlot.insertMany(
        timeSlotsToInsert,
        { session }
      );

      return booking;
    })



  } catch (e) {
    throw new Error(e);
  }
  finally {
    await session.endSession();
  }

};

export const cancelBookingBeforePay = async (bookingId, userId) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    user_id: userId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "pending") {
    throw new Error("Booking cannot be cancelled");
  }

  const payment = await Payment.findOne({
    booking_id: booking._id,
    status: { $in: ["Pending", "Completed"] },
  });

  if (payment) {
    throw new Error("Booking already has payment");
  }

  booking.status = "cancelled";
  await booking.save();

  return booking;
};

const combineDateAndTime = (date, time) => {
  const d = new Date(date);

  const [hour, minute] = time.split(":").map(Number);

  d.setHours(hour, minute, 0, 0);

  return d;
}

export const completeFinishedBookings = async () => {
  const now = new Date();

  const bookings = await Booking.find({
    status: "confirmed",
  });

  for (const booking of bookings) {
    const details = await BookingDetails.find({
      booking_id: booking._id,
    });

    if (!details.length) continue;

    let latestEnd = null;

    for (const detail of details) {
      const endDateTime = combineDateAndTime(
        detail.play_date,
        detail.end_time
      );

      if (!latestEnd || endDateTime > latestEnd) {
        latestEnd = endDateTime;
      }
    }

    if (latestEnd && latestEnd <= now) {
      booking.status = "completed";
      await booking.save();
    }
  }
};

export const getBookingOfUser = async (userId, searchKeyword, statusFilter, page, limit) => {
  const skip = (page - 1) * limit;
  
  let queryCondition = { user_id: userId };

  if (statusFilter === 'completed') {
    queryCondition.status = 'completed';
  } else if (statusFilter === 'other') {
    queryCondition.status = { $ne: 'completed' };
  }

  if (searchKeyword && searchKeyword.trim() !== '') {
    // Tìm tất cả các sân có tên chứa từ khóa tìm kiếm (Không phân biệt hoa thường nhờ i-regex)
    const matchedComplexes = await SportComplex.find({
      name: { $regex: searchKeyword.trim(), $options: 'i' }
    }).select('_id').lean();

    // Gom tất cả các _id tìm được thành một mảng [id1, id2, ...]
    const complexIds = matchedComplexes.map(complex => complex._id);

    // Ép điều kiện: Booking phải thuộc về một trong các sân nằm trong danh sách complexIds này
    queryCondition.complex_id = { $in: complexIds };
  }

  const total = await Booking.countDocuments(queryCondition);
  const bookings = await Booking.find(queryCondition)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("complex_id", "name address sport_type")
    .select("_id complex_id booking_date total_price status qr_code_url ")
    .lean();
  return { bookings, total };
};

export const getNextBookingOfUser = async (userId, stateStatus) => {
  try {
    const now = new Date();
    
    // 1. Xác định điều kiện lọc dựa trên stateStatus truyền vào
    let searchStatus = "";
    let dateCondition = {};
    let sortCondition = {};

    if (stateStatus === "active") {
      searchStatus = "confirmed";
      dateCondition = { $gte: now }; 
      sortCondition = { booking_date: 1 }; 
    } else if (stateStatus === "completed") {
      searchStatus = "completed";
      // Đơn đã xong gần đây nhất: Ngày đặt sân phải nhỏ hơn thời gian hiện tại
      dateCondition = { $lt: now }; 
      sortCondition = { booking_date: -1 }; 
    } else {
      // Trường hợp status không hợp lệ
      return { totalBookings: 0, booking: null };
    }

    const [totalBookings, booking] = await Promise.all([
      // Truy vấn 1: Đếm tổng số lượng đơn theo trạng thái của User
      Booking.countDocuments({
        user_id: userId,
        status: searchStatus
      }),

      // Truy vấn 2: Lấy ra đúng 1 đơn thỏa mãn điều kiện thời gian gần nhất
      Booking.findOne({
        user_id: userId,
        status: searchStatus,
        booking_date: dateCondition,
      })
        .sort(sortCondition)
        .populate("complex_id", "name")
        .select("_id complex_id booking_date ")
        .lean()
    ]);

    // 3. Trả về cấu trúc dữ liệu đồng nhất cho Front-end dễ xử lý
    return {
      totalBookings,
      booking        
    };

  } catch (error) {
    console.error("Lỗi khi lấy thông tin booking stats:", error);
    throw error;
  }
};

export const getBookingDetailService = async (user_id, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, user_id: user_id });
  if (!booking) {
    throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này!");
  }

  const details = await BookingDetails.find({ booking_id: bookingId })
  .populate({
    path: "sub_field_id",
    select: "field_name config_id", 
    populate: {
      path: "config_id",
      select: "field_type", 
    },
  })
  .lean(); 

  const formattedList = details.map((item) => ({
    _id: item._id.toString(),
    booking_id: item.booking_id.toString(),
    sub_field_id: {
      _id: item.sub_field_id?._id?.toString() || "",
      name: item.sub_field_id?.field_name || "Sân chưa đặt tên",
      field_type: item.sub_field_id?.config_id?.field_type || "unknown",
    },
    play_date: item.play_date,
    price: item.price,
    start_time: item.start_time,
    end_time: item.end_time,
  }));

  const primaryImage = await FieldImage.findOne({
    complex_id: booking.complex_id,
    image_type: "Overall",
    is_primary: true
  }).lean();
  
  return {
    ListBookingDetail: formattedList,
    primary_image_url: primaryImage?.image_url || "https://images.unsplash.com/photo-1541250848049-b4f71413cc30?q=80&w=600&auto=format&fit=crop"
  };
};