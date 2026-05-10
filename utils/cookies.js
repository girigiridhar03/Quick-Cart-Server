import {
  ACCESS_TOKEN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  CSRF_TOKEN,
  REFRESH_TOKEN,
} from "./constant.js";
import {
  createAccessToken,
  createCSRFToken,
  createRefreshToken,
} from "./jwt.js";

export const createTokenOptions = (maxAge) => {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge,
  };
};

export const createCSRFOptions = (maxAge) => {
  return {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge,
  };
};

export const setAuthCookies = ({ res, userId, role, tokenVersion = 0 }) => {
  const accessToken = createAccessToken(userId, role, tokenVersion);
  const refreshToken = createRefreshToken(userId, role, tokenVersion);
  const csrfToken = createCSRFToken();

  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_TOKEN, accessToken, createTokenOptions(accessMaxAge));
  res.cookie(REFRESH_TOKEN, refreshToken, createTokenOptions(refreshMaxAge));
  res.cookie(CSRF_TOKEN, csrfToken, createCSRFOptions(refreshMaxAge));

  return {
    refreshToken,
    refreshMaxAge,
    accessMaxAge,
  };
};

export const clearCookies = (res) => {
  const clearOptions = {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge: 0,
  };

  res.clearCookie(ACCESS_TOKEN, clearCookies);
  res.clearCookie(REFRESH_TOKEN, clearCookies);
  res.clearCookie(CSRF_TOKEN, clearCookies);
};
