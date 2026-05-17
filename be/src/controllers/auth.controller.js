import {
  registerService,
  loginService,
  verifyEmailService,
  resendVerificationEmailService,
  forgotPasswordService,
  resetPasswordService,
  refreshTokenService
} from "../services/auth.service.js";
import { validatePassword } from "../validators/validate.js";
import cookieUtils from "../utils/cookie.js";
import {validateString} from "../utils/sanitizer.js";
const isProduction = process.env.NODE_ENV === "production";

const getTokenFromRequest = (req) => req.query.token || req.body.token;

export const register = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password not strong enough"
      });
    }

    const result = await registerService({ name, phone, password, email });

    return res.status(201).json({
      message: "Register successful. Please verify your email.",
      user: result.user,
      ...(isProduction
        ? {}
        : {
          verificationToken: result.verificationToken,
          verificationLink: result.verificationLink
        })
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const validatedPhone = validateString(phone, 'phone');
    const validatedPassword = validateString(password, 'password');
    const rs = await loginService({ phone: validatedPhone, password: validatedPassword });

    await cookieUtils.setAuthCookies(res, String(rs.user._id), rs.access_token, rs.refresh_token);

    return res.json({
      id: rs.user.id,
      phone: rs.user.phone,
      email: rs.user.email
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    cookieUtils.clearAuthCookies(res);

    return res.json({
      message: "logout success",
    });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const refreshController = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    const result = await refreshTokenService(refreshToken);

    // set lại cookie
    await cookieUtils.setAuthCookies(
      res,
      result.userId,
      result.accessToken,
      result.refreshToken
    );

    return res.json({
      message: "Token refreshed",
    });

  } catch (err) {
    return res.status(401).json({
      message: err.message || "Refresh failed",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = getTokenFromRequest(req);

    const user = await verifyEmailService({ token });

    return res.json({
      message: "Email verified successfully",
      user
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Missing email" });
    }

    const result = await resendVerificationEmailService({ email });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Missing email" });
    }

    const result = await forgotPasswordService({ email });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Missing password" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password not strong enough"
      });
    }

    const user = await resetPasswordService({ token, password });

    return res.json({
      message: "Password reset successful",
      user
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
