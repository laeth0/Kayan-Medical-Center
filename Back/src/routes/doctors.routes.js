import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js"; // ← يدعم authorize('role1','role2') و authorize.all(...)
import validate from "../middlewares/validate.js";

import {
  createWindowSchema,
  rangeSchema,
  slotsQuerySchema,
  updateDoctorProfileSchema,
  changePasswordSchema
} from "../validators/doctors.schema.js";

import {
  listDoctors,
  listSlots,
  listWorkingHours,
  createWorkingWindow,
  deleteWorkingWindow,
  listAppointments,
  getAppointment,
  getMyProfile,
  updateMyProfile,
  changeMyPassword
} from "../controllers/doctors.controller.js";

const router = Router();

router.get("/", listDoctors);

router.get(
  "/slots",
  validate("query", slotsQuerySchema),
  listSlots
);

router.get(
  "/working-hours",
  authenticate,
  authorize("doctor"),
  listWorkingHours
);

router.post(
  "/working-hours",
  authenticate,
  authorize("doctor"),
  validate("body", createWindowSchema),
  createWorkingWindow
);


router.delete(
  "/working-hours/:id",
  authenticate,
  authorize("doctor"),
  deleteWorkingWindow
);



router.get(
  "/appointments",
  authenticate,
  authorize("doctor"),
  validate("query", rangeSchema),
  listAppointments
);


router.get(
  "/appointments/:id",
  authenticate,
  authorize("doctor"),
  getAppointment
);


router.get(
  "/me/profile",
  authenticate,
  authorize("doctor"),
  getMyProfile
);

router.put(
  "/me/profile",
  authenticate,
  authorize("doctor"),
  validate("body", updateDoctorProfileSchema),
  updateMyProfile
);

router.put(
  "/me/password",
  authenticate,
  authorize("doctor"),
  validate("body", changePasswordSchema),
  changeMyPassword
);


export default router;
