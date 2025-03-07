const socketIo = require("socket.io");
const { addUser, updateUserStatus, removeUser, findAvailableDoctor, getOnlineUsers, getOnlineUsersWithInfo } = require("./doctorCacheService");
const { authenticateSocket } = require("../middlewares/socketAuth");

const initializeWebSocket = (server) => {
    const io = socketIo(server, { cors: { origin: "*" } });
    console.log("==========asche=========")
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        const { id, role } = socket.user;
        const socketId = socket.id.toString();

        console.log(`User connected: ${socketId} | Role: ${role}`);
        addUser(id, role, socketId);
        const onlineUsers = getOnlineUsersWithInfo();
        console.log("==========list of online users===========", onlineUsers)
        io.emit("doctor:list", findAvailableDoctor());


        socket.on("doctor:busy", () => {
            if (role === "doctor") {
                updateUserStatus(id, "busy");
                io.emit("doctor:list", findAvailableDoctor());
            }
        });

        socket.on("doctor:free", () => {
            if (role === "doctor") {
                updateUserStatus(id, "online");
                io.emit("doctor:list", findAvailableDoctor());
            }
        });


        socket.on("call:initiate", () => {
            if (role === "patient") {
                const availableDoctorId = findAvailableDoctor();
                if (!availableDoctorId) {
                    socket.emit("call:failed", { message: "No available doctors" });
                    return;
                }
                io.to(availableDoctorId).emit("call:request", { patientId: id });
            }
        });


        socket.on("call:accept", () => {
            if (role === "doctor") {
                updateUserStatus(id, "busy");
                io.emit("doctor:list", findAvailableDoctor());
            }
        });

        socket.on("call:reject", () => {
            if (role === "doctor") {
                updateUserStatus(id, "online");
                io.emit("doctor:list", findAvailableDoctor());
            }
        });

        socket.on("disconnect", () => {
            console.log("===============remove===========",socketId)
            removeUser(socketId);
            io.emit("doctor:list", findAvailableDoctor());
        });
    });
};

module.exports = { initializeWebSocket };
