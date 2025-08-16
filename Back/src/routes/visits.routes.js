
import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import { completeVisit, getDoctorVisitDetails, getPatientVisitDetails, listDoctorVisits, listPatientVisits, startVisit } from "../controllers/visits.controller.js";

const router = Router();

router.get(
    "/patient",
    authenticate,
    authorize("patient"),
    listPatientVisits
);

router.get(
    "/patient/:id",
    authenticate,
    authorize("patient"),
    getPatientVisitDetails
);

router.post(
    "/start",
    authenticate,
    authorize("doctor"),
    startVisit
);

router.post(
    "/:appointmentId/complete",
    authenticate,
    authorize("doctor"),
    completeVisit
);

router.get(
    "/doctor",
    authenticate,
    authorize("doctor"),
    listDoctorVisits
);


router.get(
    "/doctor/:id",
    authenticate,
    authorize("doctor"),
    getDoctorVisitDetails
);


export default router;
