import Booking from "../models/booking.model.js";
import BookingDetails from "../models/booking_details.model.js";
import Payment from "../models/payment.model.js";
import SubField from "../models/sub_field.model.js";
import FieldTypeConfig from "../models/field_type_configs.model.js";
import mongoose from "mongoose";
import { CalculatePrice } from "./subfield.service.js";

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

export const getBookingOfUser = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const total = await Booking.countDocuments({ user_id: userId });
  const bookings = await Booking.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("complex_id", "name")
    .select("_id complex_id booking_date total_price  status total_price")
    .lean();
    
  return { bookings, total };
};