const jwt = require("jsonwebtoken");

const authenticateSocket = async (socket, next) => {
    const token = socket.handshake.headers.token;
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (error) {
        next(new Error("Authentication error: Invalid token"));
    }
};

module.exports = { authenticateSocket };
