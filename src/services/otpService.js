const { otpCache } = require("../utils/otpCache");

const storeOtp = async (phone) => {
  const otp = "1234";
  otpCache.del(phone);
  otpCache.set(phone, otp, 150);
};

const verifyOtp = async (phone, otp) => {
  const cachedOtp = otpCache.get(phone);
  if (!cachedOtp || cachedOtp !== otp) {
    return false;
  }
  otpCache.del(phone);
  return true;
};

module.exports = {
  storeOtp,
  verifyOtp,
};
