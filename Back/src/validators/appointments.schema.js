import Joi from "joi";
import { VISIT_TYPES } from "../constant/index.js";

export const createSchema = Joi.object({
    doctor_id: Joi.string().length(24).hex().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    visitType: Joi.string().valid(...Object.values(VISIT_TYPES)).required(),
    reason: Joi.string().allow("", null),
    notes: Joi.string().allow("", null),
}).options({ abortEarly: false, stripUnknown: true });

export const listPatientSchema = Joi.object({
    when: Joi.string().valid("upcoming", "past").default("upcoming"),
    q: Joi.string().allow("", null).default(""),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
}).options({ abortEarly: false, stripUnknown: true });



