import crypto from "node:crypto";
import dotenv from 'dotenv';

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const CSRF_COOKIE = "csrf_token";

dotenv.config();

const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

const COOKIE_SAME_SITE =
  process.env.COOKIE_SAME_SITE === "strict" ||
  process.env.COOKIE_SAME_SITE === "none" ||
  process.env.COOKIE_SAME_SITE === "lax"
    ? process.env.COOKIE_SAME_SITE
    : "lax";

// ----------------------

const createCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
  maxAge,
});

const createCsrfCookieOptions = (maxAge) => ({
  httpOnly: false, // cho FE đọc
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
  maxAge,
});

// ----------------------


const createCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
}

const setAuthCookies = (res, userId, accessToken, refreshToken, csrfToken) => {

  const accessMaxAge = 45 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE, accessToken, createCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, createCookieOptions(refreshMaxAge));
  res.cookie(CSRF_COOKIE, csrfToken, createCsrfCookieOptions(refreshMaxAge));
};

// ----------------------

const clearAuthCookies = (res) => {
  const clearOptions = {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  };

  res.clearCookie(ACCESS_COOKIE, clearOptions);
  res.clearCookie(REFRESH_COOKIE, clearOptions);
  res.clearCookie(CSRF_COOKIE, clearOptions);
};

// ----------------------

const requireCsrf = (req, res, next) => {
  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.header("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      message: "Invalid csrf Token",
    });
  }

  next();
};

// ----------------------

export default {
  setAuthCookies,
  clearAuthCookies,
  requireCsrf,
  createCsrfToken
};
