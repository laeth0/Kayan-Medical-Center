import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "../constant/refereshToken.js";



export function issueAccessToken(userId, roles) {
    const payload = { sub: String(userId), roles, jti: crypto.randomUUID() };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: process.env.JWT_ALGORITHM,
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
}


export function issueRefreshToken(userId, jti) {
    const payload = { sub: String(userId), jti };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        algorithm: process.env.JWT_ALGORITHM,
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
        expiresIn: process.env.REFRESH_EXPIRES_IN,
    });
}

export function verifyRefresh(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        algorithms: [process.env.JWT_ALGORITHM],
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
    });
}

export function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const newJti = () => crypto.randomUUID();
