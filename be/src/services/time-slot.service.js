import BookingDetails from "../models/booking_details.model.js";
import TimeSlot from "../models/time_slot.model.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const releaseLockedTimeSlots = async (bookingId) => {
  const details = await BookingDetails.find({ booking_id: bookingId }).lean();
  const conditions = details.map((detail) => {
    const date = dayjs(detail.play_date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
    return {
      sub_field_id: detail.sub_field_id,
      booked_date: {
        $gte: dayjs.tz(date, "YYYY-MM-DD", "Asia/Ho_Chi_Minh").startOf("day").toDate(),
        $lte: dayjs.tz(date, "YYYY-MM-DD", "Asia/Ho_Chi_Minh").endOf("day").toDate(),
      },
      time: `${detail.start_time} - ${detail.end_time}`,
      status: "Locked",
    };
  });

  if (conditions.length) await TimeSlot.deleteMany({ $or: conditions });
};
