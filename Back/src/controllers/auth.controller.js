import User from "../models/User.js";
import Role from "../models/Role.js";
import RefreshToken from "../models/RefreshToken.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { issueAccessToken, issueRefreshToken, verifyRefresh, sha256, newJti, setRefreshCookie } from "../utils/jwt.js";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "../constant/refereshToken.js";




/**
 * @desc Authenticates a user and returns access and refresh tokens.
 * @route POST /auth/login
 * @access public
 *
 * @body
 *  - email: string (required)
 *  - password: string (required)
 *
 * @returns
 *  - 200: { accessToken, user: { id, full_name, email, roles } }
 *  - 401: Invalid credentials
 *  - 500: Login failed
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const rows = await Role.find({ user_id: user._id }).select("role -_id").lean();
    const roles = rows.map(r => r.role);

    const accessToken = issueAccessToken(user._id, roles);

    const jti = newJti();
    const refreshToken = issueRefreshToken(user._id, jti);
    const { exp } = verifyRefresh(refreshToken);

    await RefreshToken.create({
      user_id: user._id,
      jti,
      token_hash: sha256(refreshToken),
      expires_at: new Date(exp * 1000),
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: { id: user._id, full_name: user.full_name, email: user.email, roles },
    });
  } catch {
    return res.status(500).json({ message: "Login failed" });
  }
}


/**
 * @desc Registers a new patient user and returns access and refresh tokens.
 * @route POST /auth/register
 * @access public
 *
 * @body
 *  - full_name: string (required)
 *  - email: string (required, must be unique)
 *  - password: string (required)
 *  - phone: string (required)
 *  - date_of_birth: string (required, format YYYY-MM-DD)
 *  - gender: string (required)
 *
 * @returns
 *  - 201: { id, email, roles, accessToken }
 *  - 409: Email already in use
 *  - 500: Registration failed
 */
export async function register(req, res) {
  try {
    const { full_name, email, password, phone, date_of_birth, gender } = req.body;
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const password_hash = await hashPassword(password);
    const user = await User.create({ full_name, email, password_hash, phone, date_of_birth, gender });
    await Role.create({ user_id: user._id, role: "patient" });

    const accessToken = issueAccessToken(user._id, ["patient"]);

    const jti = newJti();
    const refreshToken = issueRefreshToken(user._id, jti);
    const { exp } = verifyRefresh(refreshToken);
    await RefreshToken.create({
      user_id: user._id, jti,
      token_hash: sha256(refreshToken),
      expires_at: new Date(exp * 1000),
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      id: user._id,
      email: user.email,
      roles: ["patient"],
      accessToken,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
}

/**
 * @desc Issues a new access token and refresh token using a valid refresh token cookie.
 * @route POST /auth/refresh-token
 * @access public
 *
 * @cookie
 *  - rt: string (required, valid refresh token)
 *
 * @returns
 *  - 200: { accessToken }
 *  - 401: Missing or invalid refresh token
 */
export async function refreshToken(req, res) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const { sub: userId, jti } = verifyRefresh(token);

    const doc = await RefreshToken.findOne({ user_id: userId, jti });
    if (!doc || doc.revoked_at || doc.token_hash !== sha256(token)) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const nextJti = newJti();
    const nextRefresh = issueRefreshToken(userId, nextJti);
    const { exp } = verifyRefresh(nextRefresh);

    doc.revoked_at = new Date();
    doc.replaced_by = nextJti;
    await doc.save();

    await RefreshToken.create({
      user_id: userId,
      jti: nextJti,
      token_hash: sha256(nextRefresh),
      expires_at: new Date(exp * 1000),
    });

    const rows = await Role.find({ user_id: userId }).select("role -_id").lean();
    const roles = rows.map(r => r.role);
    const accessToken = issueAccessToken(userId, roles);

    setRefreshCookie(res, nextRefresh);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: "Could not refresh token" });
  }
}


/**
 * @desc Logs out the user by revoking their refresh token and clearing the refresh cookie.
 * @route POST /auth/logout
 * @access public
 *
 * @cookie
 *  - rt: string (optional, valid refresh token)
 *
 * @returns
 *  - 200: { ok: true }
 */
export async function logout(req, res) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      try {
        const { sub, jti } = verifyRefresh(token);
        await RefreshToken.findOneAndUpdate({ user_id: sub, jti }, { $set: { revoked_at: new Date() } });
      } catch { }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { ...REFRESH_COOKIE_OPTIONS });
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
}
