const bcrypt = require("bcryptjs");
const statusCodes = require("../utils/statusCodes");
const errorResponseHandler = require("../utils/errorResponseHandler");
const OtpService = require("../services/otpService");
const PatientService = require("../services/patientService");

const registerPatientController = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, gender, password, otp } = req.body;
    if (!name || !email || !phone || !dateOfBirth || !gender || !password || !otp) {
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
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      password: hashedPassword,
    });

    return res.success(newPatient, "Patient registered successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

module.exports = {
    registerPatientController
}