const Joi = require("joi");

const doctorRegistrationSchema = Joi.object({
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  email: Joi.string().email().max(100).required(),
  phone: Joi.string().max(20).required(),
  password: Joi.string().min(6).max(255).required(),
  status: Joi.string()
    .valid("online", "offline", "busy", "connected")
    .optional(),
});

const doctorLoginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\d{10,15}$/)
    .required(),
  otp: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required(),
});

module.exports = { doctorRegistrationSchema, doctorLoginSchema };
