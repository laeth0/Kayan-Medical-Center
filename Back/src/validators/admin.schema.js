

import Joi from "joi";

const ROLE_VALUES = ["doctor", "finance"];
const GENDERS = ["male", "female", "other"];


export const listSchema = Joi.object({
    role: Joi.string().valid(...ROLE_VALUES).required(),
    q: Joi.string().allow("", null),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(25),
}).options({ abortEarly: false, stripUnknown: true });


export const createSchema = Joi.object({
    full_name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(1).required(),
    phone: Joi.string().min(5).required(),
    date_of_birth: Joi.string().isoDate().required(),
    gender: Joi.string().valid(...GENDERS).required(),
    role: Joi.string().valid(...ROLE_VALUES).required(),

    specialty: Joi.string().allow("", null),
    license_no: Joi.string().allow("", null),
    slot_minutes: Joi.number().integer().min(5).max(240).allow(null),
}).options({ abortEarly: false, stripUnknown: true });


export const updateSchema = Joi.object({
    full_name: Joi.string().min(2),
    email: Joi.string().email(),
    phone: Joi.string().min(5),
    date_of_birth: Joi.string().isoDate(),
    gender: Joi.string().valid(...GENDERS),
    specialty: Joi.string().allow("", null),
    license_no: Joi.string().allow("", null),
    slot_minutes: Joi.number().integer().min(5).max(240).allow(null),
}).options({ abortEarly: false, stripUnknown: true });
