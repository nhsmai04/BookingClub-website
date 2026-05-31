import express from "express";
import {
  login,
  register,
  verifyEmail,
  verifyEmailConfirm,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  refreshController,
  logout
} from "../controllers/auth.controller.js";
import rateLimit from 'express-rate-limit';
import auth from "../middlewares/auth.middleware.js";
import { getMe, updateMe, updatePassword } from "../controllers/user.controller.js";
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsWithStats,
} from "../controllers/review.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/review.validation.js";
import cookieUtils from "../utils/cookie.js";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 15 // tối đa 15 request / IP
});

router.all("*", auth)

router.post("/register", register);
router.post("/login", limiter, login); //trong 1 phut chi request duoc 10 lan
router.post("/refresh", cookieUtils.requireCsrf, refreshController);
router.post("/logout",cookieUtils.requireCsrf, logout);
router.get("/verify-email", verifyEmail);
router.get("/verify-email/confirm", verifyEmailConfirm);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", getMe);
router.put("/me/update", cookieUtils.requireCsrf, updateMe);
router.patch("/me/update-password", cookieUtils.requireCsrf, updatePassword);
//review
router.post("/reviews", validate(createReviewSchema), createReview);
router.get("/reviews", getReviews);
router.get("/reviews/with-stats", getReviewsWithStats);
router.get("/reviews/:id", getReviewById);
router.put("/reviews/:id", validate(updateReviewSchema), updateReview);
router.delete("/reviews/:id", deleteReview);


export default router;
