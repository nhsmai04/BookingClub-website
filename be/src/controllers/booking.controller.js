import {
    createBooking,
    cancelBookingBeforePay,
    getBookingOfUser,
    getNextBookingOfUser,
    getBookingDetailService,
} from "../services/booking.service.js";
import { getDetailReviewByUserIdService } from "../services/review.service.js";

export const createBookingController = async (req, res) => {
    try {
        const booking = await createBooking(req.user.id, req.body);

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const cancelBookingController = async (req, res) => {
    try {
        const booking = await cancelBookingBeforePay(
            req.params.bookingId,
            req.user.id
        );

        return res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getBookingOfUserController = async (req, res) => {
    try {
        const user_id = req.user.id;
        const searchKeyword = req.query.keyword || '';
        const statusFilter = req.query.status;
        const pageRaw = Number(req.query.page);
        const limitRaw = Number(req.query.limit);
        const page = pageRaw > 0 ? pageRaw : 1;
        const limit = limitRaw > 0 ? limitRaw : 10;

        const { bookings, total } = await getBookingOfUser(user_id, searchKeyword, statusFilter, page, limit);
        return res.status(200).json({
            data: bookings,
            total: total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getDetailReviewByUserId = async (req, res) => {
  try {
    const user_id = req.user.id;
    const bookingId = req.params.bookingId;
    const reviews = await getDetailReviewByUserIdService(user_id, bookingId);
    res.json(reviews||null);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const getNextBookingOfUserController = async (req, res) => {
    try {
        const user_id = req.user.id;
        const stateStatus = req.query.status || null;
        const {totalBookings, booking} = await getNextBookingOfUser(user_id, stateStatus);
        return res.status(200).json({ totalBookings, booking });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
export const getBookingDetailController = async (req, res) => {
    try {
        const user_id = req.user.id;
        const bookingId = req.params.bookingId;
        const bookingDetail = await getBookingDetailService(user_id, bookingId);
        return res.status(200).json(bookingDetail);
    }catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
