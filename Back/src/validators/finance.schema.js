
import Joi from "joi";

export const financeVisitsListSchema = Joi.object({
  doctor_q: Joi.string().trim().allow(""),
  patient_q: Joi.string().trim().allow(""),
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(""),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).options({ abortEarly: false, stripUnknown: true });
