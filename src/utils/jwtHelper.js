const jwt = require("jsonwebtoken");
const { jwtSecret, JWT_EXPIRATION } = require("../configs/variables");

const generateToken = (doctor) => {
  const payload = {
    id: doctor.id,
    phone: doctor.phone,
    role: doctor.role
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION });
};
const generatePatientToken = (data) => {
  const payload = {
    id: data.id,
    role: data.role,
    phone: data.phone
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION });
};

module.exports = { generateToken, generatePatientToken };
