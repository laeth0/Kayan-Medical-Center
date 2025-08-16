import Joi from "joi";
import { DAY_VALUES } from "../constant/index.js";

export const createWindowSchema = Joi.object({
    weekday: Joi.string().valid(...DAY_VALUES).required(),
    start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
}).options({ abortEarly: false, stripUnknown: true });

export const rangeSchema = Joi.object({
    from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
}).options({ abortEarly: false, stripUnknown: true });

export const slotsQuerySchema = Joi.object({
    doctor_id: Joi.string().length(24).hex().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
}).options({ abortEarly: false, stripUnknown: true });


export const updateDoctorProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(120).required(),
  phone: Joi.string().min(5).max(40).required(),
  date_of_birth: Joi.string().allow(null, "").pattern(/^\d{4}-\d{2}-\d{2}$/),
  gender: Joi.string().valid("male", "female", "other").required(),
  specialty: Joi.string().allow("", null).max(120),
  license_no: Joi.string().allow("", null).max(120),
  slot_minutes: Joi.number().integer().min(5).max(240).default(30),
}).options({ abortEarly: false, stripUnknown: true });

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().min(1).required(),
  new_password: Joi.string().min(8).max(128).required(), 
}).options({ abortEarly: false, stripUnknown: true });