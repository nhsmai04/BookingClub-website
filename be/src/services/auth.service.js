import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "./email.service.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.js"

const getApiBaseUrl = () => (process.env.API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");
const getClientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const verifyTokenExpiresMinutes = Number(process.env.EMAIL_VERIFICATION_EXPIRE_MINUTES || 60);
const resetTokenExpiresMinutes = Number(process.env.PASSWORD_RESET_EXPIRE_MINUTES || 30);

const createToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createExpiryDate = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const mapUser = (user) => ({
  id: user._id,
  phone: user.phone,
  email: user.email,
  status: user.status,
  role: user.role,
  email_verified: user.email_verified,
  created_at: user.created_at
});

const buildVerificationLink = (token) => `${getApiBaseUrl()}/api/v1/verify-email?token=${token}`;
const buildResetLink = (token) => `${getClientUrl()}/reset-password?token=${token}`;

const sendVerificationEmail = async ({ email, phone, token }) => {
  const verificationLink = buildVerificationLink(token);

  await sendMail({
    to: email,
    subject: "BookingClub - Verify your email",
    text: `Hi ${phone || email}, verify your email here: ${verificationLink}`,
    html: `<p>Hi ${phone || email},</p><p>Please verify your email by clicking this link:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
  });

  return verificationLink;
};

const sendResetPasswordEmail = async ({ email, phone, token }) => {
  const resetLink = buildResetLink(token);

  await sendMail({
    to: email,
    subject: "BookingClub - Reset your password",
    text: `Hi ${phone || email}, reset your password here: ${resetLink}`,
    html: `<p>Hi ${phone || email},</p><p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
  });

  return resetLink;
};

export const registerService = async ({ name, phone, password, email }) => {
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new Error("Phone already exists");
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = createToken();
  const emailVerifyTokenHash = hashToken(verificationToken);
  const emailVerifyTokenExpiresAt = createExpiryDate(verifyTokenExpiresMinutes);

  const user = await User.create({
    name,
    phone,
    password: hashedPassword,
    email,
    status: "Pending",
    email_verified: false,
    email_verify_token_hash: emailVerifyTokenHash,
    email_verify_token_expires_at: emailVerifyTokenExpiresAt
  });

  const verificationLink = await sendVerificationEmail({
    email,
    phone,
    token: verificationToken
  });

  return {
    user: mapUser(user),
    verificationToken,
    verificationLink
  };
};

export const loginService = async ({ phone, password }) => {
  const user = await User.findOne({ phone: phone });

  if (!user) throw new Error("Wrong email or password");

  if (!user.email_verified || user.status === "Pending") {
    throw new Error("Please verify your email first");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Wrong email or password");
  }

  //tao token
  const access_token = createAccessToken(user);
  const refresh_token = createRefreshToken(user);

  return {
    access_token,
    refresh_token,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email
    }
  }
};

export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  // verify refresh token
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new Error("User not found");
  }

  // tạo token mới
  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  return {
    userId: decoded.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const verifyEmailService = async ({ token }) => {
  if (!token) {
    throw new Error("Verification token is required");
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    email_verify_token_hash: tokenHash,
    email_verify_token_expires_at: { $gt: new Date() }
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  user.email_verified = true;
  user.status = "Active";
  user.email_verify_token_hash = null;
  user.email_verify_token_expires_at = null;

  await user.save();

  return mapUser(user);
};

export const resendVerificationEmailService = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.email_verified) {
    throw new Error("Email already verified");
  }

  const verificationToken = createToken();
  user.email_verify_token_hash = hashToken(verificationToken);
  user.email_verify_token_expires_at = createExpiryDate(verifyTokenExpiresMinutes);
  user.status = "Pending";

  await user.save();

  const verificationLink = await sendVerificationEmail({
    email: user.email,
    phone: user.phone,
    token: verificationToken
  });

  return {
    message: "Verification email sent",
    verificationLink
  };
};

export const forgotPasswordService = async ({ email }) => {
  const users = await User.find().lean();

users.forEach((u) => {
  console.log({
    email: u.email,
    type: typeof u.email,
    json: JSON.stringify(u.email),
    length: u.email?.length
  });
});
  
  console.log("Forgot password request for email:", email);
  const user = await User.findOne({ email });
  console.log("User found:", user);
  if (!user) {
    throw new Error("User not found");
  }

  const resetToken = createToken();
  user.reset_password_token_hash = hashToken(resetToken);
  user.reset_password_token_expires_at = createExpiryDate(resetTokenExpiresMinutes);

  await user.save();

  const resetLink = await sendResetPasswordEmail({
    email: user.email,
    phone: user.phone,
    token: resetToken
  });

  return {
    message: "Password reset email sent",
    resetLink
  };
};

export const resetPasswordService = async ({ token, password }) => {
  if (!token) {
    throw new Error("Reset token is required");
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    reset_password_token_hash: tokenHash,
    reset_password_token_expires_at: { $gt: new Date() }
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(password, 10);
  user.reset_password_token_hash = null;
  user.reset_password_token_expires_at = null;

  await user.save();

  return mapUser(user);
};
