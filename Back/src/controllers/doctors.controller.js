
import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import DoctorWorkingHour from "../models/DoctorWorkingHour.js";
import Appointment from "../models/Appointment.js";
import { toMin, toHHMM, overlaps, localDate } from "../utils/time.js";
import { DAY_VALUES } from "../constant/index.js";


/**
 * @desc Lists all doctors with their id, name, and specialty.
 * @route GET /doctors
 * @access public
 *
 * @returns
 *  - 200: [ { id, name, specialty } ]
 */
export async function listDoctors(_req, res) {
    const doctorRoles = await Role.find({ role: "doctor" }).select("user_id -_id").lean();
    const ids = doctorRoles.map(r => r.user_id);
    const docs = await User.find({ _id: { $in: ids } })
        .select("_id full_name specialty")
        .lean();
    const data = docs.map(d => ({ id: String(d._id), name: d.full_name, specialty: d.specialty || "—" }));
    res.json(data);
}


/**
 * @desc Lists available time slots for a doctor on a specific date.
 * @route GET /doctors/slots?doctor_id=&date=YYYY-MM-DD
 * @access public
 *
 * @query
 *  - doctor_id: string (required, 24-char ObjectId)
 *  - date: string (required, format YYYY-MM-DD)
 *
 * @returns
 *  - 200: [ "HH:MM", ... ] — array of available time slots
 *  - 404: Doctor not found
 */
export async function listSlots(req, res) {
    const { doctor_id, date } = req.query;

    const doctor = await User.findById(doctor_id).select("slot_minutes").lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const [y, m, d] = date.split("-").map(Number);
    const dayObj = localDate(y, m, d);
    const weekday = DAY_VALUES[dayObj.getDay()];

    const windows = await DoctorWorkingHour
        .find({ doctor_id, weekday })
        .select("start_time end_time -_id")
        .lean();

    if (!windows.length) return res.json([]);

    const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

    const taken = await Appointment.find({
        doctor_id,
        status: { $ne: "cancelled" },
        start_time: { $lt: endOfDay },
        end_time: { $gt: startOfDay },
    }).select("start_time end_time -_id").lean();

    const takenRanges = taken.map(a => {
        const s = new Date(a.start_time);
        const e = new Date(a.end_time);
        return { s: s.getHours() * 60 + s.getMinutes(), e: e.getHours() * 60 + e.getMinutes() };
    });

    const now = new Date();
    const isToday = now.getFullYear() === y && (now.getMonth() + 1) === m && now.getDate() === d;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const out = [];
    for (const w of windows) {
        let s = toMin(w.start_time);
        const end = toMin(w.end_time);
        while (s + doctor.slot_minutes <= end) {
            const e = s + doctor.slot_minutes;
            if (isToday && s < nowMin) { s += doctor.slot_minutes; continue; }
            const conflict = takenRanges.some(r => overlaps(s, e, r.s, r.e));
            if (!conflict) out.push(toHHMM(s));
            s += doctor.slot_minutes;
        }
    }
    res.json(Array.from(new Set(out)).sort());
}

/**
 * @desc Lists all working hours for the authenticated doctor.
 * @route GET /doctors/working-hours
 * @access doctor (must be authenticated)
 *
 * @returns
 *  - 200: [ { _id, doctor_id, weekday, start_time, end_time }
 */
export async function listWorkingHours(req, res) {
    const doctorId = req.user?.sub;
    const rows = await DoctorWorkingHour.find({ doctor_id: doctorId }).lean();
    res.json(rows);
}


/**
 * @desc Creates a new working window for the authenticated doctor.
 * @route POST /doctors/working-hours
 * @access doctor (must be authenticated)
 *
 * @body
 *  - weekday: string (required)
 *  - start_time: string (required, format HH:MM)
 *  - end_time: string (required, format HH:MM)
 *
 * @returns
 *  - 201: { _id, doctor_id, weekday, start_time, end_time }
 *  - 400: start_time must be before end_time
 *  - 409: Overlapping window
 */
export async function createWorkingWindow(req, res) {
    const { weekday, start_time, end_time } = req.body;

    const a = toMin(start_time);
    const b = toMin(end_time);
    if (!(a < b)) {
        return res.status(400).json({ message: "start_time must be before end_time" });
    }

    const doctorId = req.user?.sub;

    const existing = await DoctorWorkingHour.find({ doctor_id: doctorId, weekday }).lean();
    const conflict = existing.some(w => overlaps(a, b, toMin(w.start_time), toMin(w.end_time)));
    if (conflict) {
        return res.status(409).json({ message: "Overlapping window" });
    }

    const row = await DoctorWorkingHour.create({
        doctor_id: doctorId,
        weekday,
        start_time,
        end_time,
    });

    res.status(201).json(row.toObject());
}



/**
 * @desc Deletes a working window by ID for the authenticated doctor.
 * @route DELETE /doctors/working-hours/:id
 * @access doctor (must be authenticated)
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — working window ID
 *
 * @returns
 *  - 200: { ok: true } — deleted successfully
 *  - 403: Forbidden (not owner)
 *  - 404: Not found
 */
export async function deleteWorkingWindow(req, res) {
    const row = await DoctorWorkingHour.findOne({ _id: req.params.id });
    if (!row) {
        return res.status(404).json({ message: "Not found" });
    }

    const doctorId = req.user?.sub;
    if (String(row.doctor_id) !== String(doctorId)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    await DoctorWorkingHour.deleteOne({ _id: row._id });
    res.json({ ok: true });
}


/**
 * @desc Lists appointments for the authenticated doctor within a date range.
 * @route GET /doctors/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access doctor (must be authenticated)
 *
 * @query
 *  - from: string (required, format YYYY-MM-DD)
 *  - to: string (required, format YYYY-MM-DD)
 *
 * @returns
 *  - 200: [ { _id, start_time, end_time, status, VisitType, reason, patient } ]
 */
export async function listAppointments(req, res) {
    const from = new Date(`${req.query.from}T00:00:00.000Z`);
    const to = new Date(`${req.query.to}T23:59:59.999Z`);

    const doctorId = req.user?.sub;

    const rows = await Appointment.find({
        doctor_id: doctorId,
        start_time: { $lt: to },
        end_time: { $gt: from },
    })
        .sort({ start_time: 1 })
        .select("_id start_time end_time status VisitType reason patient_id")
        .populate({ path: "patient_id", select: "full_name" })
        .lean();

    const data = rows.map((r) => ({
        _id: r._id,
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        VisitType: r.VisitType,
        reason: r.reason,
        patient: r.patient_id ? { id: r.patient_id._id, full_name: r.patient_id.full_name } : null,
    }));
    console.log("Appointments found:", data);

    res.json(data);
}


/**
 * @desc Returns details of a specific appointment for the authenticated doctor.
 * @route GET /doctors/appointments/:id
 * @access doctor (must be authenticated)
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — appointment ID
 *
 * @returns
 *  - 200: { _id, start_time, end_time, status, VisitType, reason, notes, patient }
 *  - 400: Invalid appointment id
 *  - 404: Appointment not found
 */
export async function getAppointment(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid appointment id" });
    }

    const doctorId = req.user?.sub;

    const appt = await Appointment.findOne({ _id: id, doctor_id: doctorId })
        .select("_id start_time end_time status VisitType reason notes patient_id")
        .populate({ path: "patient_id", select: "full_name gender date_of_birth phone" })
        .lean();

    if (!appt) {
        return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
        _id: appt._id,
        start_time: appt.start_time,
        end_time: appt.end_time,
        status: appt.status,
        VisitType: appt.VisitType,
        reason: appt.reason,
        notes: appt.notes,
        patient: appt.patient_id
            ? {
                id: appt.patient_id._id,
                full_name: appt.patient_id.full_name,
                gender: appt.patient_id.gender,
                date_of_birth: appt.patient_id.date_of_birth,
                phone: appt.patient_id.phone,
            }
            : null,
    });
}


/**
 * @desc Returns the authenticated doctor's own profile (non-sensitive fields).
 * @route GET /doctors/me/profile
 * @access doctor (must be authenticated)
 *
 * @returns
 *  - 200: { _id, full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes }
 *  - 404: Doctor not found
 */
export async function getMyProfile(req, res) {
    const userId = req.user?.sub;
    const doc = await User.findById(userId)
        .select("_id full_name email phone date_of_birth gender specialty license_no slot_minutes")
        .lean();

    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    return res.json(doc);
}


/**
 * @desc Updates the authenticated doctor's profile.
 * @route PUT /doctors/me/profile
 * @access doctor (must be authenticated)
 *
 * @body
 *  - full_name: string (optional)
 *  - phone: string (optional)
 *  - gender: string (optional)
 *  - specialty: string (optional)
 *  - license_no: string (optional)
 *  - slot_minutes: number (optional)
 *  - date_of_birth: string (optional, format YYYY-MM-DD)
 *
 * @returns
 *  - 200: { _id, full_name, email, phone, date_of_birth, gender, specialty, license_no, slot_minutes }
 *  - 404: Doctor not found
 */
export async function updateMyProfile(req, res) {
    const userId = req.user?.sub;

    const allowed = [
        "full_name", "phone", "gender", "specialty", "license_no", "slot_minutes"
    ];
    const set = {};
    for (const k of allowed) if (k in req.validated.body) set[k] = req.validated.body[k];

    if ("date_of_birth" in req.validated.body) {
        set.date_of_birth = req.validated.body.date_of_birth
            ? new Date(req.validated.body.date_of_birth)
            : undefined;
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: set },
        { new: true, runValidators: true }
    ).select("_id full_name email phone date_of_birth gender specialty license_no slot_minutes");

    if (!updated) return res.status(404).json({ message: "Doctor not found" });
    return res.json(updated);
}


/**
 * @desc Changes the authenticated doctor's password.
 * @route PUT /doctors/me/change-password
 * @access doctor (must be authenticated)
 *
 * @body
 *  - current_password: string (required)
 *  - new_password: string (required)
 *
 * @returns
 *  - 200: { ok: true } — password changed successfully
 *  - 400: Current password is incorrect
 *  - 404: Doctor not found
 */
export async function changeMyPassword(req, res) {
    const userId = req.user?.sub;
    const { current_password, new_password } = req.validated.body;

    const user = await User.findById(userId).select("_id password_hash");
    if (!user) return res.status(404).json({ message: "Doctor not found" });

    const ok = await bcrypt.compare(current_password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const saltRounds = 12;
    const hash = await bcrypt.hash(new_password, saltRounds);
    user.password_hash = hash;
    await user.save();

    return res.json({ ok: true });
}
