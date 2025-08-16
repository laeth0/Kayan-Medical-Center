import Joi from "joi";


export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required()
}).options({ abortEarly: false, stripUnknown: true });


export const registerSchema = Joi.object({
  full_name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
  phone: Joi.string().min(5).required(),
  date_of_birth: Joi.date().iso().required(),
  gender: Joi.string().valid("male", "female", "other").required()
}).options({ abortEarly: false, stripUnknown: true });
