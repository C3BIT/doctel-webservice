const { otpCache } = require("../utils/otpCache");
const axios = require("axios");
const SMS_API_URL = "https://api.sms.net.bd/sendsms";
const API_KEY = process.env.SMS_API_KEY;
const OTP_EXPIRY_TIME = 150;
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
const storeOtp = async (phone) => {
  const otp = generateOtp();
  otpCache.del(phone);
  otpCache.set(phone, otp, OTP_EXPIRY_TIME);
  const message = `Your DOCTEL OTP Code is ${otp}.`;
  const url = `${SMS_API_URL}?api_key=${API_KEY}&msg=${encodeURIComponent(
    message
  )}&to=${phone}`;
  await axios.get(url);
};

const verifyOtp = async (phone, otp) => {
  const cachedOtp = otpCache.get(phone);
  if (!cachedOtp || cachedOtp !== otp) {
    return false;
  }
  otpCache.del(phone);
  return true;
};
const shortenUrlTiny = async (longUrl) => {
  const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
  return response.data;
};

const sendPrescriptionLink = async (phone, prescriptionUrl) => {
  if (!phone || !prescriptionUrl)
    throw new Error("Phone number and prescription URL are required");
  const shortUrl = await shortenUrlTiny(prescriptionUrl);
  const message = `Your prescription is ready. Click the link to view your prescription: ${shortUrl}`;
  const url = `${SMS_API_URL}?api_key=${API_KEY}&msg=${encodeURIComponent(
    message
  )}&to=${phone}`;
   await axios.get(url);
};

module.exports = {
  storeOtp,
  verifyOtp,
  sendPrescriptionLink
};
