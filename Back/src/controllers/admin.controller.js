import Role from "../models/Role.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Visit from "../models/Visit.js";
import DoctorWorkingHour from "../models/DoctorWorkingHour.js";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../constant/roles.js";


/**
 * @desc Returns counts of users with "doctor" and "finance" roles.
 * @route GET /admin/stats
 * @access admin
 *
 * @returns
 *  - 200: { doctors: number, finance: number }
 *  - 500: Failed
 */
export async function getAdminStats(_req, res) {
    try {
        const [doctors, finance] = await Promise.all([
            Role.countDocuments({ role: "doctor" }),
            Role.countDocuments({ role: "finance" }),
        ]);

        return res.json({ doctors, finance });
    } catch (err) {
        return res.status(500).json({ message: "Failed to load stats" });
    }
}


/**
 * @desc Lists users with "doctor" or "finance" roles, supports search and pagination.
 * @route GET /admin/users?role=doctor|finance[&q=&page=&limit=]
 * @access admin
 *
 * @query
 *  - role: string ("doctor" or "finance") — required
 *  - q: string (optional) — search by name, email, or phone
 *  - page: number (optional, default: 1)
 *  - limit: number (optional, default: 25, max: 100)
 *
 * @returns
 *  - 200: { page, limit, total, data: [ { id, full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes } ] }
 */
export async function listUsers(req, res) {
    // values already validated & sanitized by validate("query", listSchema)
    const validated = res.locals.validated?.query || req.query;
    const { role, q, page, limit } = validated;

    const roleRows = await Role.find({ role }).select("user_id -_id").lean();
    const ids = roleRows.map((r) => r.user_id);

    const filter = { _id: { $in: ids } };
    if (q) {
        filter.$or = [
            { full_name: new RegExp(q, "i") },
            { email: new RegExp(q, "i") },
            { phone: new RegExp(q, "i") },
        ];
    }

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
        User.find(filter)
            .select("_id full_name email phone date_of_birth gender specialty license_no slot_minutes")
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return res.json({
        page,
        limit,
        total,
        data: rows.map((u) => ({
            id: String(u._id),
            full_name: u.full_name,
            email: u.email,
            phone: u.phone,
            date_of_birth: u.date_of_birth,
            gender: u.gender,
            specialty: u.specialty,
            license_no: u.license_no,
            slot_minutes: u.slot_minutes,
        })),
    });
}


/**
 * @desc Returns details of a user by ID, including their role.
 * @route GET /admin/getUser/:id
 * @access admin
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — user ID
 *
 * @returns
 *  - 200: { id, role, full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes }
 *  - 400: Invalid user id
 *  - 404: User not found
 */
export async function getUser(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });

    const [user, roleRow] = await Promise.all([
        User.findById(id)
            .select("_id full_name email phone date_of_birth gender specialty license_no slot_minutes")
            .lean(),
        Role.findOne({ user_id: id }).select("role -_id").lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
        id: String(user._id),
        role: roleRow?.role || null,
        ...user,
    });
}


/**
 * @desc Creates a new user with "doctor" or "finance" role.
 * @route POST /admin/createUser
 * @access admin
 *
 * @body
 *  - full_name: string (required)
 *  - email: string (required, must be unique)
 *  - password: string (required)
 *  - phone: string (required)
 *  - date_of_birth: string (required, format YYYY-MM-DD)
 *  - gender: string (required)
 *  - role: string ("doctor" or "finance", required)
 *  - specialty: string (optional, required for doctor)
 *  - license_no: string (optional, required for doctor)
 *  - slot_minutes: number (optional, required for doctor)
 *
 * @returns
 *  - 201: { id } — user created successfully
 *  - 400: Validation failed
 *  - 409: Email already
 */
export async function createUser(req, res) {
    const {
        full_name,
        email,
        password,
        phone,
        date_of_birth,
        gender,
        role,
        specialty,
        license_no,
        slot_minutes,
    } = res.locals.validated?.body || req.body;

    const exists = await User.findOne({ email }).lean();
    if (exists) {
        return res.status(409).json({ message: "Email already in use" });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const isDoctor = role === USER_ROLES.DOCTOR;

    const user = await User.create({
        full_name,
        email,
        password_hash,
        phone,
        date_of_birth,
        gender,
        specialty: isDoctor ? (specialty || "") : undefined,
        license_no: isDoctor ? (license_no || "") : undefined,
        slot_minutes: isDoctor ? (slot_minutes ?? 30) : undefined,
    });

    await Role.create({ user_id: user._id, role });

    return res.status(201).json({ id: String(user._id) });
}



/**
 * @desc Updates details of a user by ID.
 * @route PUT /admin/users/:id
 * @access admin
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — user ID
 *
 * @body
 *  - Any updatable user fields (full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes)
 *
 * @returns
 *  - 200: { id, full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes }
 *  - 400: Validation failed or invalid user id
 *  - 404: User
 */
export async function updateUser(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }

    const patch = res.locals.validated?.body || req.body;

    const updated = await User.findByIdAndUpdate(
        id,
        { $set: patch },
        { new: true, runValidators: true }
    )
        .select("_id full_name email phone date_of_birth gender specialty license_no slot_minutes")
        .lean();

    if (!updated) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ id: String(updated._id), ...updated });
}



/**
 * @desc Deletes a user with "doctor" or "finance" role by ID.
 * @route DELETE /admin/users/:id
 * @access admin
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — user ID
 *
 * @returns
 *  - 204: User deleted successfully
 *  - 400: Invalid user id or not a doctor/finance user
 *  - 404: User or role not found
 *  - 409: Doctor has related appointments/visits and cannot be deleted
 */
export async function deleteUser(req, res) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }

    const roleRow = await Role.findOne({ user_id: id }).select("role -_id").lean();
    if (!roleRow) {
        return res.status(404).json({ message: "User or role not found" });
    }

    if (!["doctor", "finance"].includes(roleRow.role)) {
        return res.status(400).json({ message: "Only doctor/finance users can be removed here" });
    }

    if (roleRow.role === "doctor") {
        const [hasAppointments, hasVisits] = await Promise.all([
            Appointment.exists({ doctor_id: id }),
            Visit.exists({ doctor_id: id }),
        ]);

        if (hasAppointments || hasVisits) {
            return res.status(409).json({
                message: "Doctor has related appointments/visits and cannot be deleted.",
            });
        }

        await Promise.all([
            DoctorWorkingHour.deleteMany({ doctor_id: id }),
            Role.deleteMany({ user_id: id }),
        ]);

        await User.deleteOne({ _id: id });
        return res.status(204).send();
    }

    await Role.deleteMany({ user_id: id });
    await User.deleteOne({ _id: id });

    return res.status(204).send();
}
