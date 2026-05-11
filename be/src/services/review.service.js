import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import SubField from "../models/sub_field.model.js";
import mongoose from "mongoose";

// CREATE
export const createReviewService = async ({ booking_id, user_id, rating, comment }) => {
    // check booking tồn tại
    const booking = await Booking.findById(booking_id);

    if (!booking) {
        throw new Error("Booking not found");
    }

    // check đúng user
    if (booking.user_id.toString() !== user_id) {
        throw new Error("You can only review your own booking");
    }

    // check đã review chưa
    const existingReview = await Review.findOne({ booking_id });
    if (existingReview) {
        throw new Error("You already reviewed this booking");
    }

    const complex_id = booking.complex_id;

    const review = await Review.create({
        booking_id,
        user_id,
        complex_id: complex_id,
        rating,
        comment,
        created_at: new Date()
    });

    return review;
};

// UPDATE
export const updateReviewService = async (id, user_id, data) => {
    const review = await Review.findById(id);
    if (!review) {
        throw new Error("Review not found");
    }

    if (review.user_id.toString() !== user_id) {
        throw new Error("Unauthorized");
    }

    review.rating = data.rating ?? review.rating;
    review.comment = data.comment ?? review.comment;

    await review.save();
    return review;
};

// DELETE
export const deleteReviewService = async (id, user_id) => {
    const review = await Review.findById(id);
    if (!review) {
        throw new Error("Review not found");
    }

    if (review.user_id.toString() !== user_id) {
        throw new Error("Unauthorized");
    }

    await review.deleteOne();
    return { message: "Deleted successfully" };
};


// GET ALL (có thể filter theo complex)
export const getReviewsService = async (complex_id) => {
    const filter = complex_id ? { complex_id } : {};

    return await Review.find(filter)
        .populate("user_id", "email phone")
        .sort({ createdAt: -1 });
};

// GET BY ID
export const getReviewByIdService = async (id) => {
    const review = await Review.findById(id).populate("user_id", "email");
    if (!review) {
        throw new Error("Review not found");
    }
    return review;
};


// GET WITH STATS
export const getReviewsWithStatsService = async (query) => {
    const { complex_id, page = 1, limit = 10 } = query;

    const filter = {};

    if (complex_id) {
        filter.complex_id = new mongoose.Types.ObjectId(complex_id);
    }

    // tính stats
    const stats = await Review.aggregate([
        { $match: filter },
        {
            $group: {
                _id: "$rating",
                count: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);

    // stats
    let totalReviews = 0;
    let totalRating = 0;

    const ratingBreakdown = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    };

    stats.forEach((item) => {
        const rating = item._id;
        const count = item.count;

        ratingBreakdown[rating] = count;
        totalReviews += count;
        totalRating += rating * count;
    });

    const avgRating =
        totalReviews === 0 ? 0 : (totalRating / totalReviews).toFixed(1);

    // Lấy list review (có pagination)
    const reviews = await Review.find(filter)
        .populate("user_id", "name email avatar_url") //sau này có avatar thì thêm vô sau
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return {
        avgRating: Number(avgRating),
        totalReviews,
        ratingBreakdown,
        reviews,
    };
};

// GET DETAIL REVIEW BY USER ID (cho phần quản lý của user)
export const getDetailReviewByUserIdService = async ( user_id, booking_id ) => {
  const filter = {
    user_id,
    ...(booking_id && { booking_id }),
  };

  return await Review.find(filter)
    .select("rating comment");
};