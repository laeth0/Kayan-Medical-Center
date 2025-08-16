

export const isProd = process.env.NODE_ENV === "production";
export const REFRESH_COOKIE_NAME = "rt";
export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
};