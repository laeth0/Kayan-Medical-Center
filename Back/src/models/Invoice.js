import { Schema, model, Types } from "mongoose";

const InvoiceSchema = new Schema(
  {
    reviewed_by:  { type: Types.ObjectId, ref: "User" }, // finance (اختياري)
    visit_id:     { type: Types.ObjectId, ref: "Visit", unique: true, required: true },
    total_amount: { type: Number, default: 0, min: 0 },
    reviewed_at:  { type: Date }
  },
  { timestamps: true }
);

export default model("Invoice", InvoiceSchema);
