import { Router } from "express";
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";
import { login, logout, refreshToken, register } from "../controllers/auth.controller.js";

const router = Router();

router.post(
    "/login",
    validate("body", loginSchema),
    login
);

router.post(
    "/register",
    validate("body", registerSchema),
    register
);

router.post(
    "/refresh-token",
    refreshToken
);

router.post(
    "/logout",
    logout
);

export default router;
