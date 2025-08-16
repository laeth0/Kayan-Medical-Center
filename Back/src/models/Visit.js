import { Schema, model, Types } from "mongoose";
import { ENCOUNTER_STATUS } from "../constant/index.js";


const VisitSchema = new Schema(
  {
    appointment_id: { type: Types.ObjectId, ref: "Appointment", unique: true, sparse: true },
    patient_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    doctor_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date },
    status: { type: String, enum: Object.values(ENCOUNTER_STATUS), default: "in_progress" },
    clinical_notes: String
  },
  { timestamps: true }
);

export default model("Visit", VisitSchema);
