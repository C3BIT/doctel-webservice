const jwt = require("jsonwebtoken");
const { jwtSecret, JWT_EXPIRATION } = require("../configs/variables");

const generateToken = (doctor) => {
  const payload = {
    id: doctor.id,
    email: doctor.email,
    role: doctor.role
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION });
};

module.exports = { generateToken };
