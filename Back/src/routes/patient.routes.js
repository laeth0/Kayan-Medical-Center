
import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import validate from "../middlewares/validate.js";
import { getMyProfile, updateMyProfile } from "../controllers/patient.controller.js";
import { updateProfileSchema } from "../validators/patient.schema.js";

const router = Router();

router.get(
    "/profile",
    authenticate,
    authorize("patient"),
    getMyProfile
);

router.put(
    "/profile",
    authenticate,
    authorize("patient"),
    validate("body", updateProfileSchema),
    updateMyProfile
);

export default router;
