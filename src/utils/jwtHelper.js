const jwt = require("jsonwebtoken");
const { jwtSecret, JWT_EXPIRATION } = require("../configs/variables");

const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION });
};

const generatePatientToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION });
};

module.exports = { generateToken, generatePatientToken };
