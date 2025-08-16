import { Schema, model, Types } from "mongoose";
import { DAYS } from "../constant/index.js";

const DoctorWorkingHourSchema = new Schema(
  {
    doctor_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    weekday: { type: String, enum: Object.values(DAYS), required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true }
  },
  { timestamps: true }
);

export default model("DoctorWorkingHour", DoctorWorkingHourSchema);
