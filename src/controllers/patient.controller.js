const bcrypt = require("bcryptjs");
const OtpService = require("../services/otpService");
const PatientService = require("../services/patientService");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const { statusCodes } = require("../utils/statusCodes");

const registerPatientController = async (req, res) => {
  try {
    const { phone, password, otp } = req.body;
    if (!phone || !password || !otp) {
      throw Object.assign(new Error("Missing required fields"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40002, reason: "All fields are required" },
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
