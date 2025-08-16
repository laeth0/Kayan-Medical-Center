import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    phone: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    gender: { type: String, required: true },

    // Doctor fields (optional)
    specialty: String,
    license_no: String,
    slot_minutes: Number
  },
  { timestamps: true }
);

export default model("User", UserSchema);
