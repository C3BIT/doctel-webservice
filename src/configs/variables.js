const DB_URL = process.env.DB_URL;
const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.PORT;
const jwtSecret = process.env.JWT_SECRET;
const JWT_EXPIRATION=process.env.JWT_EXPIRATION;
module.exports = {
  DB_URL,
  NODE_ENV,
  PORT,
  jwtSecret,
  JWT_EXPIRATION,
};