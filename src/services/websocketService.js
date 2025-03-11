const socketIo = require("socket.io");
const crypto = require("crypto");
const {
  addUser,
  updateUserStatus,
  removeUser,
  findAvailableDoctor,
  getOnlineUsersWithInfo,
} = require("./doctorCacheService");
const { authenticateSocket } = require("../middlewares/socketAuth");

const initializeWebSocket = (server) => {
  const io = socketIo(server, { cors: { origin: "*" } });
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { id, role, phone } = socket.user;
    const socketId = socket.id.toString();

    console.log(`User connected: ${socketId} | Role: ${role}`);
    addUser(phone, role, socketId);
    const onlineUsers = getOnlineUsersWithInfo();
    console.log("=============onlineUsers=========", onlineUsers);
    io.emit("doctor:list", findAvailableDoctor());
    socket.on("doctor:busy", () => {
      if (role === "doctor") {
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctor());
      }
    });

    socket.on("doctor:free", () => {
      if (role === "doctor") {
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctor());
      }
    });

    socket.on("call:initiate", () => {
      if (role === "patient") {
        const selectedDoctor = findAvailableDoctor();

        if (!selectedDoctor) {
          socket.emit("call:failed", { message: "No available doctors" });
          return;
        }

        const roomId = crypto
          .createHash("sha256")
          .update(`${phone}_${selectedDoctor.phone}`)
          .digest("hex")
          .slice(0, 16);

        const jitsiRoomLink = `https://call.bloomattires.com/${roomId}`;

        io.to(selectedDoctor.socketId).emit("call:request", {
          patientId: phone,
          jitsiRoom: jitsiRoomLink,
        });
        io.to(socketId).emit("call:initiated", {
          doctorId: selectedDoctor.phone,
          jitsiRoom: jitsiRoomLink,
        });

        console.log(
          `📞 Call initiated: Patient ${id} ↔ Doctor ${selectedDoctor.id}`
        );
        console.log(`🔗 Jitsi Room: ${jitsiRoomLink}`);
        // updateUserStatus(selectedDoctor.id, "busy");
        io.emit("doctor:list", findAvailableDoctor());
      }
    });

    socket.on("call:accept", () => {
      console.log("==========accepted call===========");
      if (role === "doctor") {
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctor());
      }
    });

    socket.on("call:reject", () => {
      console.log("==========rejected call===========");
      if (role === "doctor") {
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctor());
      }
    });

    socket.on("disconnect", () => {
      removeUser(socketId);
      io.emit("doctor:list", findAvailableDoctor());
      const connected = getOnlineUsersWithInfo();
    });
  });
};

module.exports = { initializeWebSocket };
