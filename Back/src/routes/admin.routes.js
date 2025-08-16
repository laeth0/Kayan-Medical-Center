import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import { createUser, deleteUser, getAdminStats, getUser, listUsers, updateUser } from "../controllers/admin.controller.js";
import validate from "../middlewares/validate.js";
import { createSchema, listSchema, updateSchema } from "../validators/admin.schema.js";

const router = Router();

router.get(
    "/stats",
    authenticate,
    authorize("admin"),
    getAdminStats
);

router.get(
    "/listUsers",
    authenticate,
    authorize("admin"),
    validate("query", listSchema),
    listUsers
);

router.get(
    "/getUser/:id",
    authenticate,
    authorize("admin"),
    getUser
);

router.post(
    "/createUser",
    authenticate,
    authorize("admin"),
    validate("body", createSchema),
    createUser
);


router.put(
    "/updateUser/:id",
    authenticate,
    authorize("admin"),
    validate("body", updateSchema),
    updateUser
);

router.delete(
    "/deleteUser/:id",
    authenticate,
    authorize("admin"),
    deleteUser
);

export default router;
