const Joi = require('joi');

const patientRegistrationSchema = Joi.object({
  phone: Joi.string()
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 digits',
      'string.empty': 'Phone number is required',
      'any.required': 'Phone number is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 20 characters',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
  
  otp: Joi.string()
    .length(4)
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 4 digits',
      'string.pattern.base': 'OTP must be a 4-digit number',
      'string.empty': 'OTP is required',
      'any.required': 'OTP is required'
    })
});
const patientUpdateSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  email: Joi.string().email().max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]+$/).min(10).max(20).optional(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid("Male", "Female", "Other").optional(),
  address: Joi.string().optional(),
  height: Joi.number().min(30).max(250).optional(),
  weight: Joi.number().min(2).max(300).optional(),
}).min(1);
module.exports = {
  patientRegistrationSchema,
  patientUpdateSchema
};