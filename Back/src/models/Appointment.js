import { Schema, model, Types } from "mongoose";
import { APPOINTMENT_STATUS } from "../constant/index.js";
import { VISIT_TYPES } from "../constant/index.js";

const AppointmentSchema = new Schema(
  {
    patient_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    doctor_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },

    status: { type: String, enum: Object.values(APPOINTMENT_STATUS), default: "booked" },
    reason: String,
    notes: String,
    VisitType: { type: String, enum: Object.values(VISIT_TYPES) },

    created_by: { type: Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now }
  }
);

AppointmentSchema.index({ doctor_id: 1, start_time: 1, end_time: 1 });

export default model("Appointment", AppointmentSchema);
