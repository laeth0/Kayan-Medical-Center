
import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import { listFinanceVisits } from "../controllers/finance.controller.js";
import { financeVisitsListSchema } from "../validators/finance.schema.js";
import validate from "../middlewares/validate.js";

const router = Router();

router.get(
    "/visits",
    authenticate,
    authorize("finance"),
    validate("query", financeVisitsListSchema),
    listFinanceVisits
);

export default router;
