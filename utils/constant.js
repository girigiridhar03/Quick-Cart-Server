export const ACCESS_TOKEN = "access_token";
export const REFRESH_TOKEN = "refresh_token";
export const CSRF_TOKEN = "csrf_token";

const isProduction = process.env.NODE_ENV === "production";
const allowedSameSiteValues = new Set(["lax", "none", "strict"]);
const envSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();

export const COOKIE_SAME_SITE = allowedSameSiteValues.has(envSameSite)
  ? envSameSite
  : isProduction
    ? "none"
    : "lax";

export const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true" ||
  (!process.env.COOKIE_SECURE && (isProduction || COOKIE_SAME_SITE === "none"));
