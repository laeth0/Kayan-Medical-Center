
import mongoose from "mongoose";
import Visit from "../models/Visit.js";
import Treatment from "../models/Treatment.js";
import Invoice from "../models/Invoice.js";
import { completeVisitSchema, listPatientVisitsSchema, listVisitsSchema, startVisitSchema } from "../validators/visits.schema.js";
import Appointment from "../models/Appointment.js";
import { endOfDay, startOfDay } from "../utils/time.js";


/**
 * @desc Lists visits for the authenticated patient, supports filtering by doctor name and pagination.
 * @route GET /visit/patient?when=past|upcoming&doctor_q=&page=&limit=
 * @access patient (must be authenticated)
 *
 * @query
 *  - when: string ("past" or "upcoming") — filter by visit status
 *  - doctor_q: string (optional) — search by doctor name
 *  - page: number (optional, default: 1)
 *  - limit: number (optional, default: 25, max: 100)
 *
 * @returns
 *  - 200: { page, limit, total, data: [ { id, date, doctor, diagnosis, treatments, treatmentsCount, status } ] }
 *  - 400: Validation failed
 */
export async function listPatientVisits(req, res) {
  const { value, error } = listPatientVisitsSchema.validate(req.query);
  if (error) return res.status(400).json({ message: "Validation failed", details: error.details.map(d => ({ path: d.path?.[0], message: d.message })) });

  const patientId = req.user.sub;
  const { when, doctor_q, page, limit } = value;

  const match = { patient_id: new mongoose.Types.ObjectId(patientId) };
  if (when === "past") match.status = "completed";

  const pipeline = [
    { $match: match },
    { $sort: { end_time: -1, createdAt: -1 } },

    { $lookup: { from: "users", localField: "doctor_id", foreignField: "_id", as: "doctor" } },
    { $unwind: "$doctor" },

    ...(doctor_q?.trim()
      ? [{ $match: { "doctor.full_name": { $regex: doctor_q.trim(), $options: "i" } } }]
      : []),

    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },

          {
            $lookup: {
              from: "treatments",
              let: { vid: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$visit_id", "$$vid"] } } },
                { $project: { _id: 0, name: 1, quantity: 1, unit_price: 1, total_price: 1 } },
              ],
              as: "treatments"
            }
          },

          {
            $project: {
              _id: 1,
              start_time: 1,
              end_time: 1,
              status: 1,
              clinical_notes: 1,
              doctor_name: "$doctor.full_name",
              doctor_id: "$doctor._id",
              treatments: 1,
              treatmentsCount: { $size: "$treatments" },
              diagnosis: {
                $substr: [{ $ifNull: ["$clinical_notes", ""] }, 0, 180]
              }
            }
          }
        ],
        totalArr: [{ $count: "total" }]
      }
    },
    {
      $project: {
        rows: 1,
        total: { $ifNull: [{ $arrayElemAt: ["$totalArr.total", 0] }, 0] }
      }
    }
  ];

  const [result] = await Visit.aggregate(pipeline);
  const { rows = [], total = 0 } = result || {};
  const data = rows.map(r => ({
    id: String(r._id),
    date: r.end_time || r.start_time,
    doctor: r.doctor_name,
    diagnosis: r.diagnosis || "",
    treatments: r.treatments,
    treatmentsCount: r.treatmentsCount,
    status: r.status,
  }));

  return res.json({ page, limit, total, data });
}


/**
 * @desc Returns full visit details owned by the authenticated patient.
 * @route GET /patient/visits/:id
 * @access patient (must be authenticated)
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — visit ID
 *
 * @returns
 *  - 200: { id, start_time, end_time, status, doctor, appointment, clinical_notes, treatments, invoice }
 *  - 400: Invalid visit id
 *  - 404: Visit not found
 */
export async function getPatientVisitDetails(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid visit id" });

  const visit = await Visit.findOne({ _id: id, patient_id: req.user.sub })
    .populate({ path: "doctor_id", select: "full_name specialty" })
    .populate({ path: "appointment_id", select: "start_time end_time VisitType reason" })
    .lean();

  if (!visit) return res.status(404).json({ message: "Visit not found" });

  const [treatments, invoice] = await Promise.all([
    Treatment.find({ visit_id: visit._id }).select("name quantity unit_price total_price").lean(),
    Invoice.findOne({ visit_id: visit._id }).select("total_amount reviewed_at reviewed_by").lean(),
  ]);

  return res.json({
    id: String(visit._id),
    start_time: visit.start_time,
    end_time: visit.end_time,
    status: visit.status,
    doctor: visit.doctor_id ? {
      id: String(visit.doctor_id._id),
      name: visit.doctor_id.full_name,
      specialty: visit.doctor_id.specialty || "—"
    } : null,
    appointment: visit.appointment_id ? {
      id: String(visit.appointment_id._id),
      start_time: visit.appointment_id.start_time,
      end_time: visit.appointment_id.end_time,
      type: visit.appointment_id.VisitType,
      reason: visit.appointment_id.reason || ""
    } : null,
    clinical_notes: visit.clinical_notes || "",
    treatments,
    invoice: invoice ? { total_amount: invoice.total_amount } : null
  });
}


/**
 * @desc Starts a new visit for a doctor and patient based on an appointment.
 * @route POST /visits/start
 * @access doctor (must be authenticated and authorized)
 *
 * @body
 *  - appointmentId: string (required, 24-char ObjectId) — appointment to start the visit for
 *
 * @returns
 *  - 201: { _id, started_at } — visit started successfully
 *  - 400: Validation failed
 *  - 404: Appointment not found
 *  - 409: Appointment is cancelled or another visit is already in progress
 *  - 500: Internal error
 */
export async function startVisit(req, res) {
  const { value, error } = startVisitSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details.map((d) => d.message),
    });
  }

  const { appointmentId } = value;
  const doctorId = req.user?.sub;

  const appt = await Appointment.findOne({ _id: appointmentId, doctor_id: doctorId })
    .select("_id doctor_id patient_id status")
    .lean();

  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (appt.status === "cancelled") return res.status(409).json({ message: "Appointment is cancelled" });

  const active = await Visit.findOne({ doctor_id: doctorId, status: "in_progress" })
    .select("_id")
    .lean();

  if (active) {
    return res.status(409).json({
      message: "Another visit is already in progress for this doctor",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let visit = await Visit.findOne({ appointment_id: appointmentId }).session(session);

    if (!visit) {
      visit = await Visit.create(
        [
          {
            appointment_id: appt._id,
            patient_id: appt.patient_id,
            doctor_id: appt.doctor_id,
            start_time: new Date(),
            status: "in_progress",
          },
        ],
        { session }
      ).then((arr) => arr[0]);
    } else if (visit.status !== "in_progress") {
      throw Object.assign(new Error("Visit already exists for this appointment"), { status: 409 });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ _id: String(visit._id), started_at: visit.start_time });
  } catch (err) {
    await session.abortTransaction().catch(() => { });
    session.endSession();
    return res.status(err.status || 500).json({ message: err.message || "Failed to start visit" });
  }
}


/**
 * @desc Completes an active visit for a doctor and patient, records treatments, and generates an invoice.
 * @route POST /visits/:appointmentId/complete
 * @access doctor (must be authenticated and authorized)
 *
 * @params
 *  - appointmentId: string (required, 24-char ObjectId) — appointment to complete the visit for
 *
 * @body
 *  - treatments: array of objects (optional)
 *      - name: string (required)
 *      - description: string (optional)
 *      - quantity: number (optional, default: 1)
 *      - cost: number (optional, default: 0)
 *  - notes: string (optional) — clinical notes for the visit
 *
 * @returns
 *  - 200: { visitId, appointmentId, total_amount, status } — visit completed successfully
 *  - 400: Invalid appointment id or validation failed
 *  - 404: Appointment not found
 *  - 409: Visit not started or not active
 *  - 500: Internal error
 */
export async function completeVisit(req, res) {
  const { appointmentId } = req.params;
  if (!mongoose.isValidObjectId(appointmentId)) {
    return res.status(400).json({ message: "Invalid appointment id" });
  }

  const { value, error } = completeVisitSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details.map((d) => d.message),
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doctorId = req.user?.sub;

    const appt = await Appointment.findOne({
      _id: appointmentId,
      doctor_id: doctorId,
    })
      .select("_id patient_id doctor_id status")
      .session(session);

    if (!appt) {
      throw Object.assign(new Error("Appointment not found"), { status: 404 });
    }

    const visit = await Visit.findOne({ appointment_id: appt._id }).session(session);
    if (!visit) throw Object.assign(new Error("Visit not started"), { status: 409 });
    if (visit.status !== "in_progress")
      throw Object.assign(new Error("Visit is not active"), { status: 409 });

    let total = 0;
    if (Array.isArray(value.treatments) && value.treatments.length) {
      const docs = value.treatments.map((t) => ({
        visit_id: visit._id,
        name: t.name,
        description: t.description || "",
        quantity: Number(t.quantity) || 1,
        unit_price: Number(t.cost) || 0,
      }));
      const created = await Treatment.insertMany(docs, { session });
      total = created.reduce(
        (sum, it) =>
          sum + (Number(it.total_price) || Number(it.quantity) * Number(it.unit_price)),
        0
      );
    }

    visit.end_time = new Date();
    visit.clinical_notes = value.notes || "";
    visit.status = "completed";
    await visit.save({ session });

    await Appointment.updateOne(
      { _id: appt._id },
      { $set: { status: "fulfilled", notes: value.notes || "" } },
      { session }
    );

    await Invoice.updateOne(
      { visit_id: visit._id },
      {
        $set: {
          total_amount: Number(total.toFixed(2)),
          reviewed_by: undefined,
          reviewed_at: undefined,
        },
      },
      { upsert: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      visitId: String(visit._id),
      appointmentId: String(appt._id),
      total_amount: Number(total.toFixed(2)),
      status: "completed",
    });
  } catch (err) {
    await session.abortTransaction().catch(() => { });
    session.endSession();
    return res
      .status(err.status || 500)
      .json({ message: err.message || "Failed to complete visit" });
  }
}


/**
 * @desc Lists completed visits for the authenticated doctor, supports filtering by patient name and pagination.
 * @route GET /visits/doctor?from=&to=&patient_q=&page=&limit=
 * @access doctor (must be authenticated)
 *
 * @query
 *  - from: string (optional, format YYYY-MM-DD) — start date
 *  - to: string (optional, format YYYY-MM-DD) — end date
 *  - patient_q: string (optional) — search by patient name
 *  - page: number (optional, default: 1)
 *  - limit: number (optional, default: 10, max: 100)
 *
 * @returns
 *  - 200: { page, limit, total, data: [ { id, start_time, end_time, status, patient, total_amount } ] }
 *  - 400: Validation failed
 *  - 500: Failed to load visits
 */
export async function listDoctorVisits(req, res) {
  const { value, error } = listVisitsSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ message: "Validation failed", details: error.details.map(d => d.message) });
  }

  const { from, to, patient_q, page, limit } = value;

  const doctorId = new mongoose.Types.ObjectId(req.user?.sub);

  const timeMatch = {};
  if (from) {
    const [y, m, d] = from.split("-").map(Number);
    timeMatch.$gte = startOfDay(y, m, d);
  }
  if (to) {
    const [y, m, d] = to.split("-").map(Number);
    timeMatch.$lte = endOfDay(y, m, d);
  }
  const dateClause = Object.keys(timeMatch).length ? { start_time: timeMatch } : {};

  const pipeline = [
    { $match: { doctor_id: doctorId, status: "completed", ...dateClause } },
    { $lookup: { from: "users", localField: "patient_id", foreignField: "_id", as: "patient" } },
    { $unwind: "$patient" },
  ];

  if (patient_q && patient_q.trim()) {
    pipeline.push({
      $match: { "patient.full_name": { $regex: patient_q.trim(), $options: "i" } }
    });
  }

  pipeline.push(
    { $lookup: { from: "invoices", localField: "_id", foreignField: "visit_id", as: "invoice" } },
    { $addFields: { invoice: { $first: "$invoice" } } },
    { $sort: { start_time: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              appointment_id: 1,
              start_time: 1,
              end_time: 1,
              status: 1,
              clinical_notes: 1,
              patient: { _id: "$patient._id", full_name: "$patient.full_name", gender: "$patient.gender", date_of_birth: "$patient.date_of_birth" },
              invoice_total: "$invoice.total_amount",
            }
          }
        ],
        total: [{ $count: "count" }]
      }
    }
  );

  try {
    const [resu] = await Visit.aggregate(pipeline);
    const total = (resu?.total?.[0]?.count) || 0;
    const data = (resu?.data || []).map(v => ({
      id: String(v._id),
      start_time: v.start_time,
      end_time: v.end_time,
      status: v.status,
      patient: {
        id: String(v.patient?._id || ""),
        full_name: v.patient?.full_name || "—",
        gender: v.patient?.gender || "—",
        date_of_birth: v.patient?.date_of_birth || null,
      },
      total_amount: typeof v.invoice_total === "number" ? v.invoice_total : null,
    }));
    return res.json({ page, limit, total, data });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load visits" });
  }
}


/**
 * @desc Returns full visit details for the authenticated doctor.
 * @route GET /visits/doctor/:id
 * @access doctor (must be authenticated)
 *
 * @params
 *  - id: string (required, 24-char ObjectId) — visit ID
 *
 * @returns
 *  - 200: { id, start_time, end_time, status, clinical_notes, patient, treatments, invoice }
 *  - 400: Invalid visit id
 *  - 404: Visit not found
 *  - 500: Failed to load visit details
 */
export async function getDoctorVisitDetails(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid visit id" });
  }

  try {
    const doctorId = req.user?.sub;

    const visit = await Visit.findOne({ _id: id, doctor_id: doctorId })
      .select("_id appointment_id patient_id doctor_id start_time end_time status clinical_notes")
      .populate({ path: "patient_id", select: "full_name gender date_of_birth phone email" })
      .lean();

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const [treatments, invoice] = await Promise.all([
      Treatment.find({ visit_id: visit._id })
        .select("_id code name description quantity unit_price total_price createdAt")
        .sort({ createdAt: 1 })
        .lean(),
      Invoice.findOne({ visit_id: visit._id }).select("total_amount reviewed_by reviewed_at").lean(),
    ]);

    return res.json({
      id: String(visit._id),
      start_time: visit.start_time,
      end_time: visit.end_time,
      status: visit.status,
      clinical_notes: visit.clinical_notes || "",
      patient: visit.patient_id
        ? {
          id: String(visit.patient_id._id),
          full_name: visit.patient_id.full_name,
          gender: visit.patient_id.gender,
          date_of_birth: visit.patient_id.date_of_birth,
          email: visit.patient_id.email,
          phone: visit.patient_id.phone,
        }
        : null,
      treatments: (treatments || []).map((t) => ({
        id: String(t._id),
        code: t.code || "",
        name: t.name,
        description: t.description || "",
        quantity: t.quantity,
        unit_price: t.unit_price,
        total_price: t.total_price,
      })),
      invoice: invoice ? { total_amount: invoice.total_amount } : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load visit details" });
  }
}

