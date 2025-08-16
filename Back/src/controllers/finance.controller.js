
import Visit from "../models/Visit.js";
import { dayEnd, dayStart } from "../utils/time.js";

/**
 * @desc Lists completed visits with patient and doctor info, supports search and pagination for finance users.
 * @route GET /finance/visits?from=&to=&doctor_q=&patient_q=&page=&limit=
 * @access finance (must be authenticated)
 *
 * @query
 *  - from: string (optional, format YYYY-MM-DD) — start date
 *  - to: string (optional, format YYYY-MM-DD) — end date
 *  - doctor_q: string (optional) — search by doctor name
 *  - patient_q: string (optional) — search by patient name
 *  - page: number (optional, default: 1)
 *  - limit: number (optional, default: 25, max: 100)
 *
 * @returns
 *  - 200: { page, limit, total, data: [ { id, date, patient, doctor, total_amount } ] }
 *  - 500: Failed to load visits
 */
export async function listFinanceVisits(req, res) {
    const {
        doctor_q = "",
        patient_q = "",
        from = "",
        to = "",
        page,
        limit,
    } = res.locals.validated?.query || req.query;

    const match = {};
    match.status = "completed";

    if (from && to) match.start_time = { $gte: dayStart(from), $lte: dayEnd(to) };
    else if (from) match.start_time = { $gte: dayStart(from) };
    else if (to) match.start_time = { $lte: dayEnd(to) };

    const pipeline = [
        { $match: match },

        { $lookup: { from: "users", localField: "patient_id", foreignField: "_id", as: "patient" } },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

        { $lookup: { from: "users", localField: "doctor_id", foreignField: "_id", as: "doctor" } },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },

        ...(patient_q ? [{ $match: { "patient.full_name": { $regex: patient_q, $options: "i" } } }] : []),
        ...(doctor_q ? [{ $match: { "doctor.full_name": { $regex: doctor_q, $options: "i" } } }] : []),

        { $lookup: { from: "invoices", localField: "_id", foreignField: "visit_id", as: "invoice" } },
        { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },

        {
            $project: {
                _id: 1,
                start_time: 1,
                patient_name: "$patient.full_name",
                doctor_name: "$doctor.full_name",
                total_amount: { $ifNull: ["$invoice.total_amount", 0] },
            }
        },

        { $sort: { start_time: -1 } },

        {
            $facet: {
                data: [
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                ],
                meta: [{ $count: "total" }]
            }
        }
    ];

    try {
        const result = await Visit.aggregate(pipeline).allowDiskUse(true);
        const facet = result?.[0] || { data: [], meta: [] };
        const total = facet.meta?.[0]?.total || 0;

        return res.json({
            page,
            limit,
            total,
            data: facet.data.map(r => ({
                id: String(r._id),
                date: r.start_time,
                patient: r.patient_name || "—",
                doctor: r.doctor_name || "—",
                total_amount: r.total_amount ?? 0,
            })),
        });
    } catch {
        return res.status(500).json({ message: "Failed to load visits" });
    }
}
