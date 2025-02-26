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

module.exports = {
  patientRegistrationSchema
};