const { Op } = require("sequelize");
const OtpVerification = require("../models/OTP");

const storeOtp = async (phone) => {
  const otp = "1234";
  await OtpVerification.destroy({ where: { phone } });

  await OtpVerification.create({ phone, otp, status: "pending" });
  setTimeout(async () => {
    await OtpVerification.update(
      { status: "expired" },
      { where: { phone, status: "pending" } }
    );
  }, 150000);
};

const verifyOtp = async (phone, otp) => {
  const otpRecord = await OtpVerification.findOne({
    where: {
      phone,
      otp,
      status: "pending",
      createdAt: { [Op.gte]: new Date(Date.now() - 150000) },
    },
  });
  if (!otpRecord) return false;

  await OtpVerification.destroy({ where: { phone } });

  return true;
};


module.exports = {
    storeOtp,
    verifyOtp
}