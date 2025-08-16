
import { Schema, model, Types } from "mongoose";
import { USER_ROLES } from "../constant/index.js";

const UserRoleSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: Object.values(USER_ROLES), required: true }
  },
  { timestamps: true }
);

// composite unique (user_id, role)
UserRoleSchema.index({ user_id: 1, role: 1 }, { unique: true });

export default model("Role", UserRoleSchema);
