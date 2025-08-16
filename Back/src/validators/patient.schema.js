
import Joi from "joi";

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().min(6).max(30).required(),
  date_of_birth: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(), 
  gender: Joi.string().valid("male", "female", "other").required(),
}).options({ abortEarly: false, stripUnknown: true });
