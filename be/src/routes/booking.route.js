import express from "express";
import {
  cancelBookingController,
  createBookingController,
  getBookingOfUserController,
  getDetailReviewByUserId
} from "../controllers/booking.controller.js";
import auth from "../middlewares/auth.middleware.js";
import cookieUtils from "../utils/cookie.js";

const bookingRouter = express.Router();

bookingRouter.patch("/:bookingId/cancel", auth, cookieUtils.requireCsrf, cancelBookingController);
bookingRouter.post("/", auth, cookieUtils.requireCsrf, createBookingController);
bookingRouter.get("/history", auth, getBookingOfUserController);
bookingRouter.get("/reviews/user-review/:bookingId", auth, getDetailReviewByUserId);
export default bookingRouter;
