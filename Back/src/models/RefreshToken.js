
import { Schema, model, Types } from "mongoose";

const RefreshTokenSchema = new Schema({
  user_id: { type: Types.ObjectId, ref: "User", index: true, required: true },
  jti: { type: String, index: true, required: true },     // refresh id
  token_hash: { type: String, required: true },           // sha256(refresh)
  expires_at: { type: Date, required: true },
  revoked_at: { type: Date },
  replaced_by: { type: String },                          // next jti
}, { timestamps: true });

export default model("RefreshToken", RefreshTokenSchema);
