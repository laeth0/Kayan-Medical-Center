

import User from "../models/User.js";
import DoctorWorkingHour from "../models/DoctorWorkingHour.js";
import Appointment from "../models/Appointment.js";
import { DAY_VALUES } from "../constant/days.js";
import { hhmmToMin, toLocalDate } from "../utils/time.js";
import mongoose from "mongoose";



/**
 * @desc Creates a new appointment for a patient with a doctor.
 * @route POST /appointments
 * @access patient (must be authenticated)
 *
 * @body
 *  - doctor_id: string (required, 24-char ObjectId)
 *  - date: string (required, format YYYY-MM-DD, local date)
 *  - time: string (required, format HH:MM, 24-hour)
 *  - visitType: string (required, one of "in-clinic", "follow-up", "consultation")
 *  - reason: string (optional)
 *  - notes: string (optional)
 *
 * @returns
 *  - 201: { id, start_time, end_time, status, VisitType }
 *  - 400: Validation failed, time in past, outside working hours, not aligned to slot size, or no working hours
 *  - 404: Doctor not found
 *  - 409: Slot already taken
 *  - 500: Internal error
*/
export async function createAppointment(req, res) {
  try {
    const {
      doctor_id,
      date,
      time,
      visitType,
      reason,
      notes,
    } = res.locals.validated?.body || req.body;

    const doctor = await User.findById(doctor_id).select("slot_minutes").lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const [y, m, d] = date.split("-").map(Number);
    const [H, i] = time.split(":").map(Number);
    const start = toLocalDate(y, m, d, H, i);
    const end = new Date(start.getTime() + doctor.slot_minutes * 60 * 1000);

    const now = new Date();
    if (start <= now) {
      return res.status(400).json({ message: "Selected time is in the past" });
    }

    const weekday = DAY_VALUES[start.getDay()];
    const windows = await DoctorWorkingHour
      .find({ doctor_id, weekday })
      .select("start_time end_time -_id")
      .lean();

    if (!windows.length) {
      return res.status(400).json({ message: "Doctor has no working hours on this day" });
    }

    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();

    const insideWindow = windows.some((w) => {
      const ws = hhmmToMin(w.start_time);
      const we = hhmmToMin(w.end_time);
      return ws <= startMin && endMin <= we;
    });
    if (!insideWindow) {
      return res.status(400).json({ message: "Selected time is outside doctor's working hours" });
    }

    const aligned = windows.some((w) => {
      const ws = hhmmToMin(w.start_time);
      const we = hhmmToMin(w.end_time);
      if (!(ws <= startMin && endMin <= we)) return false;
      return ((startMin - ws) % doctor.slot_minutes) === 0;
    });
    if (!aligned) {
      return res.status(400).json({ message: "Selected time is not aligned to doctor's slot size" });
    }

    const conflict = await Appointment.exists({
      doctor_id,
      status: { $ne: "cancelled" },
      start_time: { $lt: end },
      end_time: { $gt: start },
    });
    if (conflict) {
      return res.status(409).json({ message: "Slot already taken" });
    }


    const appt = await Appointment.create({
      patient_id: req.user.sub,
      doctor_id,
      start_time: start,
      end_time: end,
      status: "booked",
      reason: reason || undefined,
      notes: notes || undefined,
      VisitType: visitType,
      created_by: req.user.sub,
      created_at: new Date(),
    });

    return res.status(201).json({
      id: appt._id,
      start_time: appt.start_time,
      end_time: appt.end_time,
      status: appt.status,
      visitType: appt.VisitType,
    });


  } catch (err) {
    return res.status(500).json({ message: err?.message || "Failed to create appointment" });
  }
}


/**
 * @desc Lists a patient's appointments (past or upcoming) with optional doctor name search and pagination.
 * @route GET /appointments/patient
 * @access patient (must be authenticated and have "patient" role)
 *
 * @query
 *  - when: string ("past" | "upcoming") — filter by time (default: "upcoming")
 *  - q: string (optional) — search by doctor name
 *  - page: number (optional, default: 1) — page number for pagination
 *  - limit: number (optional, default: 25, max: 100) — items per page
 *
 * @returns
 *  - 200: { page, limit, total, data: [ { id, doctor, startTime, endTime, status } ] }
 *  - 400: Validation failed
 *  - 403: Only patients can access this endpoint
 *  - 500: Internal error
 *
*/
export async function listPatientAppointments(req, res) {
  const { when, q, page, limit } = res.locals.validated?.query || req.query;

  const patientId = new mongoose.Types.ObjectId(req.user.sub);
  const now = new Date();

  const matchTime =
    when === "past"
      ? { start_time: { $lt: now } }
      : { start_time: { $gte: now } };

  const pipeline = [
    { $match: { patient_id: patientId, ...matchTime } },
    {
      $lookup: {
        from: "users",
        localField: "doctor_id",
        foreignField: "_id",
        as: "doctor",
      },
    },
    { $unwind: "$doctor" },
  ];

  if (q && q.trim()) {
    pipeline.push({
      $match: { "doctor.full_name": { $regex: q.trim(), $options: "i" } },
    });
  }

  const countPipeline = [...pipeline, { $count: "total" }];

  const sortStage = { $sort: { start_time: when === "past" ? -1 : 1 } };
  pipeline.push(
    sortStage,
    {
      $project: {
        id: "$_id",
        doctor: {
          $concat: [
            "$doctor.full_name",
            {
              $cond: [
                { $ifNull: ["$doctor.specialty", false] },
                { $concat: [" — ", "$doctor.specialty"] },
                "",
              ],
            },
          ],
        },
        startTime: "$start_time",
        endTime: "$end_time",
        status: "$status",
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  try {
    const [rows, totalArr] = await Promise.all([
      Appointment.aggregate(pipeline).allowDiskUse(true),
      Appointment.aggregate(countPipeline).allowDiskUse(true),
    ]);

    const total = totalArr?.[0]?.total || 0;
    return res.json({ page, limit, total, data: rows });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load appointments" });
  }
}


/**
 * @desc Cancels a patient's upcoming appointment.
 * @route PATCH /appointments/:id/cancel
 * @access patient (must be authenticated and owner of the appointment)
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — appointment ID to cancel
 *
 * @returns
 *  - 200: { id, status } — appointment cancelled successfully
 *  - 400: Invalid appointment id
 *  - 404: Appointment not found or not cancellable (already cancelled or in the past)
 *  - 500: Internal error
 *
*/
export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const patientId = req.user.sub;
    const now = new Date();

    const appt = await Appointment.findOneAndUpdate(
      {
        _id: id,
        patient_id: patientId,
        status: { $ne: "cancelled" },
        start_time: { $gt: now },
      },
      { $set: { status: "cancelled" } },
      { new: true }
    ).lean();

    if (!appt) {
      return res
        .status(404)
        .json({ message: "Appointment not found or not cancellable" });
    }

    return res.json({ id: String(appt._id), status: appt.status });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to cancel appointment" });
  }
}






