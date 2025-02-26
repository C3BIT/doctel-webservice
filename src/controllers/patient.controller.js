const bcrypt = require("bcryptjs");
const statusCodes = require("../utils/statusCodes");
const OtpService = require("../services/otpService");
const PatientService = require("../services/patientService");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");

const registerPatientController = async (req, res) => {
  try {
    const { phone, password, otp } = req.body;
    if (!phone || !password || !otp) {
      throw Object.assign(new Error("Missing required fields"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40002, reason: "All fields are required" },
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

    const newPatient = await PatientService.registerPatient({
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
