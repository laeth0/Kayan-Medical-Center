
import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * @desc Returns the authenticated patient's own profile.
 * @route GET /patient/profile
 * @access patient (must be authenticated)
 *
 * @returns
 *  - 200: { id, full_name, email, phone, date_of_birth, gender }
 *  - 400: Invalid user id
 *  - 404: User not found
 *  - 500: Failed to load profile
 */
export async function getMyProfile(req, res) {
    try {
        const userId = req.user?.sub;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const u = await User.findById(userId)
            .select("_id full_name email phone date_of_birth gender")
            .lean();

        if (!u) return res.status(404).json({ message: "User not found" });

        return res.json({
            id: String(u._id),
            full_name: u.full_name,
            email: u.email,
            phone: u.phone,
            date_of_birth: u.date_of_birth,
            gender: u.gender,
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to load profile" });
    }
}


/**
 * @desc Updates the authenticated patient's profile.
 * @route PUT /patient/profile
 * @access patient (must be authenticated)
 *
 * @body
 *  - full_name: string (optional)
 *  - email: string (optional, must be unique)
 *  - phone: string (optional)
 *  - date_of_birth: string (optional, format YYYY-MM-DD)
 *  - gender: string (optional)
 *
 * @returns
 *  - 200: { id, full_name, email, phone, date_of_birth, gender }
 *  - 400: Invalid user id
 *  - 404: User not found
 *  - 409: Email already in use
 *  - 500: Failed to update profile
 */
export async function updateMyProfile(req, res) {
    try {
        const userId = req.user?.sub;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const {
            full_name,
            email,
            phone,
            date_of_birth,
            gender,
        } = res.locals.validated?.body || req.body;

        const exists = await User.findOne({ email, _id: { $ne: userId } })
            .select("_id")
            .lean();
        if (exists) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const patch = {
            full_name,
            email,
            phone,
            date_of_birth: new Date(date_of_birth),
            gender,
        };

        const updated = await User.findByIdAndUpdate(
            userId,
            { $set: patch },
            { new: true, runValidators: true }
        )
            .select("_id full_name email phone date_of_birth gender")
            .lean();

        if (!updated) return res.status(404).json({ message: "User not found" });

        return res.json({
            id: String(updated._id),
            full_name: updated.full_name,
            email: updated.email,
            phone: updated.phone,
            date_of_birth: updated.date_of_birth,
            gender: updated.gender,
        });
    } catch {
        return res.status(500).json({ message: "Failed to update profile" });
    }
}
