import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import {
    cancelAppointment,
    createAppointment,
    listPatientAppointments,
} from "../controllers/appointments.controller.js";
import { createSchema, listPatientSchema } from "../validators/appointments.schema.js";
import validate from "../middlewares/validate.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("patient"),
    validate("body", createSchema),
    createAppointment
);

router.get(
    "/patient",
    authenticate,
    authorize("patient"),
    validate("query", listPatientSchema),
    listPatientAppointments
);

router.post(
    "/cancel/:id",
    authenticate,
    authorize("patient"),
    cancelAppointment
);

export default router;
