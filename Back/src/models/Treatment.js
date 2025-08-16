import { Schema, model, Types } from "mongoose";

const TreatmentSchema = new Schema(
  {
    visit_id:    { type: Types.ObjectId, ref: "Visit", required: true, index: true },
    code:        String,
    name:        { type: String, required: true },
    quantity:    { type: Number, default: 1, min: 0 },
    unit_price:  { type: Number, default: 0, min: 0 }, // (يمكنك استخدام Decimal128 أو تخزين بالمليم/القرش)
    total_price: { type: Number }                      // quantity * unit_price
  },
  { timestamps: true }
);

TreatmentSchema.pre("save", function(next) {
  this.total_price = Number(this.quantity) * Number(this.unit_price);
  next();
});

export default model("Treatment", TreatmentSchema);
