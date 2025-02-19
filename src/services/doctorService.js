const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");

const registerDoctor = async (data) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await Doctor.create({ ...data, password: hashedPassword });
  } catch (error) {
    throw error;
  }
};

const findDoctorByEmail = async (email) => {
  return await Doctor.findOne({ where: { email } });
};

const findDoctorByPhone = async (phone) => {
  return await Doctor.findOne({ where: { phone } });
};

const verifyPassword = async (inputPassword, storedPassword) => {
  return await bcrypt.compare(inputPassword, storedPassword);
};

module.exports = {
  registerDoctor,
  findDoctorByEmail,
  findDoctorByPhone,
  verifyPassword,
};
