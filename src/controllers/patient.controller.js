const bcrypt = require("bcryptjs");
const OtpService = require("../services/otpService");
const PatientService = require("../services/patientService");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const { statusCodes } = require("../utils/statusCodes");
const { patientRegistrationSchema } = require("../validations/patientValidation");

const registerPatientController = async (req, res) => {
  try {
    const { phone, password, otp } = req.body;
    const { error } = patientRegistrationSchema.validate({phone, password, otp }, { 
      abortEarly: false 
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      throw Object.assign(new Error("Validation failed"), {
        status: statusCodes.BAD_REQUEST,
        error: { 
          code: 40002, 
          reason: "Validation error", 
          details: errorDetails 
        },
      });
    }
    const existingPatient = await PatientService.findPatientByPhone(phone);
    if (existingPatient) {
      throw Object.assign(new Error("Patient already exists"), {
        status: statusCodes.CONFLICT,
        error: { code: 40901 },
      });
    }
    const isValidOtp = await OtpService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw Object.assign(new Error("Invalid or expired OTP"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40011 },
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await PatientService.registerPatient({
      phone,
      password: hashedPassword,
    });

    return res.success({}, "Patient registered successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

module.exports = {
  registerPatientController,
};
