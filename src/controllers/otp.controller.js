const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const OTP = require("../services/otpService");
const { statusCodes } = require("../utils/statusCodes");
const sendOtpController = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      throw Object.assign(new Error("Phone number is required"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40010 },
      });
    }
    await OTP.storeOtp(phone);
    return res.success({ phone }, "OTP sent successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

module.exports = {
  sendOtpController,
};
