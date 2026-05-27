import Booking from "../models/booking.model.js";
import Payment from "../models/payment.model.js";
import { VNPay, ProductCode, VnpLocale, ignoreLogger } from "vnpay";
import { formatDate } from "../utils/date.js";
import { generateQR } from "../utils/qrCode.js";
import BookingDetails from "../models/booking_details.model.js"
import dayjs from "dayjs";
import TimeSlot from "../models/time_slot.model.js"
export const createVnpayPayment = async (bookingId, userId) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        user_id: userId,
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.status !== "pending") {
        throw new Error("Booking is not available for payment");
    }

    const txnRef = `${booking._id}-${Date.now()}`;

    const expireMinutes = Number(process.env.VNPAY_EXPIRE_MINUTES || 60);
    const expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + expireMinutes);

    let payment = await Payment.findOne({
        booking_id: booking._id,
        payment_method: "VNPAY",
    }).sort({ createdAt: -1 });

    if (!payment || payment.status === "Failed") {
        payment = await Payment.create({
            booking_id: booking._id,
            amount: booking.total_price,
            payment_method: "VNPAY",
            status: "Pending",
            expired_at: expireDate,
            vnpay_details: {
                vnp_TxnRef: txnRef,
            },
        });
    } else {
        if (payment.status === "Completed") {
            throw new Error("Đơn đặt sân này đã được thanh toán");
        }
        if (payment.status === "Pending") {
            payment.vnpay_details.vnp_TxnRef = txnRef;
            payment.expired_at = expireDate;
            await payment.save();
        }
    }

    const vnpay = new VNPay({
        tmnCode: process.env.VNPAY_TMN_CODE,
        secureSecret: process.env.VNPAY_SECURE_SECRET,
        vnpayHost: process.env.VNPAY_HOST,
        testMode: true, // tùy chọn
        hashAlgorithm: "SHA512",
        loggerFn: ignoreLogger,
    });

    const paymentUrl = await vnpay.buildPaymentUrl({
        vnp_Amount: Number(booking.total_price),
        vnp_IpAddr: "127.0.0.1",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: txnRef,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
        vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
        vnp_CreateDate: formatDate(new Date()),
        vnp_ExpireDate: formatDate(expireDate),
    });

    payment.vnpay_details = {
        ...payment.vnpay_details,
        payment_url: paymentUrl,
    };
    await payment.save();

    return paymentUrl;
}

const updateTimeSlotStatusToBooked = async (bookingId) => {
    const bookingDetails =
        await BookingDetails.find({
            booking_id: bookingId
        });

    const updateConditions =
        bookingDetails.map(detail => ({

            sub_field_id:
                detail.sub_field_id,

            booked_date: {
                $gte: dayjs(
                    detail.play_date
                )
                    .startOf("day")
                    .toDate(),

                $lte: dayjs(
                    detail.play_date
                )
                    .endOf("day")
                    .toDate()
            },

            time:
                `${detail.start_time} - ${detail.end_time}`,

            status:
                "Locked"
        }));

    if (
        !updateConditions.length
    ) return;

    await TimeSlot.updateMany(
        {
            $or: updateConditions
        },
        {
            $set: {
                status: "Booked"
            }
        }
    );
};

export const handleVnpayReturn = async (query) => {
    const txnRef = query.vnp_TxnRef;
    const bookingId = txnRef.split("-")[0];
    const responseCode = query.vnp_ResponseCode;

    const vnpayMessages = {
        "00": "Giao dịch thành công",
        "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ",
        "09": "Thẻ hoặc tài khoản chưa đăng ký Internet Banking",
        "10": "Xác thực thông tin thẻ hoặc tài khoản sai quá 3 lần",
        "11": "Đã hết thời gian chờ thanh toán, vui lòng thực hiện lại",
        "12": "Thẻ hoặc tài khoản đã bị khóa",
        "13": "Sai mật khẩu xác thực giao dịch (OTP), vui lòng thực hiện lại",
        "24": "Khách hàng đã hủy giao dịch",
        "51": "Tài khoản không đủ số dư để thực hiện giao dịch",
        "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
        "75": "Ngân hàng thanh toán đang bảo trì",
        "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
        "99": "Lỗi khác từ VNPAY",
    };

    const message = vnpayMessages[responseCode] || "Lỗi không xác định từ VNPAY";

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new Error("Booking not found");
    }

    const payment = await Payment.findOne({
        booking_id: booking._id,
        payment_method: "VNPAY",
    }).sort({ createdAt: -1 });

    if (!payment) {
        throw new Error("Payment not found");
    }

    payment.vnpay_details = {
        ...payment.vnpay_details,
        vnp_TxnRef: query.vnp_TxnRef,
        vnp_TransactionNo: query.vnp_TransactionNo,
        vnp_CardType: query.vnp_CardType,
        vnp_BankCode: query.vnp_BankCode,
        vnp_PayDate: query.vnp_PayDate,
        vnp_ResponseCode: query.vnp_ResponseCode,
        vnpayMessages: message,
        vnp_TransactionStatus: query.vnp_TransactionStatus
    };
    await payment.save();

    if (responseCode === "00") {
        payment.status = "Completed";
        booking.status = "confirmed";
        booking.qr_code_url = await generateQR(bookingId);
        await updateTimeSlotStatusToBooked(booking._id);
    } else {
        payment.status = "Failed";
    }

    await payment.save();
    await booking.save();

    return {
        success: responseCode === "00",
        code: responseCode,
        message,
        paymentStatus: payment.status,
        bookingStatus: booking.status
    };
}

const deleteLockedTimeSlots =
    async (bookingId) => {

        const bookingDetails =
            await BookingDetails.find({
                booking_id: bookingId
            });

        const deleteConditions =
            bookingDetails.map(detail => ({

                sub_field_id:
                    detail.sub_field_id,

                booked_date: {
                    $gte: dayjs(
                        detail.play_date
                    )
                        .startOf("day")
                        .toDate(),

                    $lte: dayjs(
                        detail.play_date
                    )
                        .endOf("day")
                        .toDate()
                },

                time:
                    `${detail.start_time} - ${detail.end_time}`,

                status:
                    "Locked"
            }));

        if (deleteConditions.length) {
            await TimeSlot.deleteMany({
                $or: deleteConditions
            });
        }
    };

// job chạy nền kiểm tra các payment đã hết hạn chưa -> nếu hết hạn thì xem như hủy booking
export const cancelExpiredBookings = async () => {

    const now = new Date();

    // 1. Booking chưa payment
    // quá 10 phút
    const expiredTime = new Date(now.getTime() - 10 * 60 * 1000);

    // lấy booking sắp bị cancel
    const expiredBookings = await Booking.find({
        status: {
            $nin: [
                "confirmed",
                "completed",
                "cancelled"
            ],
        },
        createdAt: {
            $lt: expiredTime
        },
    });

    // cancel + delete slot
    for (const booking of expiredBookings) {

        booking.status = "cancelled";

        await booking.save();

        await deleteLockedTimeSlots(booking._id);
    }

    // 2. Payment hết hạn
    const expiredPayments =
        await Payment.find({
            payment_method: "VNPAY",

            status: "Pending",

            expired_at: {
                $lt: now
            },
        });

    for (const payment of expiredPayments) {

        payment.status = "Expired";

        await payment.save();

        const booking = await Booking.findOneAndUpdate(
            {
                _id: payment.booking_id,
                status: "pending",
            },
            {
                $set: {
                    status: "cancelled",
                },
            },
            {
                returnDocument: "after"
            }
        );

        if (!booking) continue;

        await deleteLockedTimeSlots(
            booking._id
        );
    }
};
