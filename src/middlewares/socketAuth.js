const jwt = require("jsonwebtoken");

const authenticateSocket = async (socket, next) => {
  const token =
    socket.handshake.headers.token ||
    socket.handshake.query.token ||
    socket.handshake.headers.authorization?.split(" ")[1];
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      phone: decoded.phone,
      ...(decoded.name && { name: decoded.name }),
      ...(decoded.image && { image: decoded.image }),
    };
    next();
  } catch (error) {
    console.log("🚨 Token Expired or Invalid:", error.message);
    socket.tokenExpired = true;
    next();
  }
};

module.exports = { authenticateSocket };
