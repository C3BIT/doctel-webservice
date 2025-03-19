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

const updateDoctorProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  status: Joi.string()
    .valid("online", "offline", "busy", "connected")
    .optional(),

  qualification: Joi.string().max(255).optional(),
  experience: Joi.number().integer().min(0).optional().messages({
    "number.base": "Experience must be a valid number.",
    "number.min": "Experience cannot be negative.",
  }),
  specialization: Joi.string().max(100).optional(),
  clinicAddress: Joi.string().optional(),
  consultationFee: Joi.number().precision(2).min(0).optional().messages({
    "number.base": "Consultation fee must be a valid number.",
    "number.min": "Consultation fee cannot be negative.",
  }),
  bio: Joi.string().optional(),
});

module.exports = {
  doctorRegistrationSchema,
  doctorLoginSchema,
  updateDoctorProfileSchema,
};
