
import Joi from "joi";

export const listPatientVisitsSchema = Joi.object({
  when: Joi.string().valid("past", "all").default("past"),
  doctor_q: Joi.string().trim().allow("", null).default(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).options({ abortEarly: false, stripUnknown: true });

export const startVisitSchema = Joi.object({
  appointmentId: Joi.string().length(24).hex().required(),
}).options({ abortEarly: false, stripUnknown: true });

export const completeVisitSchema = Joi.object({
  notes: Joi.string().allow("").default(""),
  durationSeconds: Joi.number().integer().min(0).default(0),
  treatments: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).required(),
      description: Joi.string().allow(""),
      quantity: Joi.number().integer().min(1).default(1),
      cost: Joi.number().min(0).required(),
    })
  ).default([]),
}).options({ abortEarly: false, stripUnknown: true });


export const listVisitsSchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patient_q: Joi.string().allow("").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).options({ abortEarly: false, stripUnknown: true });

