const socketIo = require("socket.io");
const crypto = require("crypto");
const {
  addUser,
  updateUserStatus,
  removeUser,
  findAvailableDoctors,
  getOnlineUsersWithInfo,
} = require("./doctorCacheService");
const { authenticateSocket } = require("../middlewares/socketAuth");

const CALL_TIMEOUT = 30000;
const pendingCalls = {};

const initializeWebSocket = (server) => {
  const io = socketIo(server, { cors: { origin: "*" } });
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { id, role, phone } = socket.user;
    const socketId = socket.id.toString();

    console.log(`✅ User connected: ${socketId} | Role: ${role}`);
    addUser(phone, role, socketId);
    io.emit("doctor:list", findAvailableDoctors());
    console.log('==============getOnlineUsersWithInfo===============', getOnlineUsersWithInfo());
    socket.on("call:initiate", () => {
      if (role === "patient") {
        let availableDoctors = findAvailableDoctors();
        console.log("==============call initiated===========", availableDoctors);
        if (availableDoctors.length === 0) {
          socket.emit("call:failed", { message: "No available doctors" });
          return;
        }
        attemptCallToNextDoctor(socket, phone, availableDoctors, io);
      }
    });

    socket.on("call:accept", () => {
      if (role === "doctor") {
        clearPendingCall(phone);
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("call:reject", () => {
      console.log("==============call rejected===========", socketId);
      if (role === "doctor") {
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("doctor:busy", () => {
      if (role === "doctor") {
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("doctor:free", () => {
      if (role === "doctor") {
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("disconnect", () => {
      removeUser(socketId);
      io.emit("doctor:list", findAvailableDoctors());
    });
  });
};

const attemptCallToNextDoctor = (socket, patientPhone, doctorQueue, io) => {
  console.log("==========doctorQueue=========", doctorQueue)
  if (doctorQueue.length === 0) {
    socket.emit("call:failed", {
      message: "No available doctors after retries",
    });
    return;
  }

  const selectedDoctor = doctorQueue.shift();
  const roomId = crypto
    .createHash("sha256")
    .update(`${patientPhone}_${selectedDoctor.phone}`)
    .digest("hex")
    .slice(0, 16);
  const jitsiRoomLink = `https://call.bloomattires.com/${roomId}`;

  io.to(selectedDoctor.socketId).emit("call:request", {
    patientId: patientPhone,
    jitsiRoom: jitsiRoomLink,
  });
  io.to(socket.id).emit("call:initiated", {
    doctorId: selectedDoctor.phone,
    jitsiRoom: jitsiRoomLink,
  });

  console.log(
    `📞 Call initiated: Patient ${patientPhone} → Doctor ${selectedDoctor.phone}`
  );
  console.log(`🔗 Jitsi Room: ${jitsiRoomLink}`);

  updateUserStatus(selectedDoctor.phone, "doctor", "busy");
  io.emit("doctor:list", findAvailableDoctors());

  pendingCalls[patientPhone] = setTimeout(() => {
    console.log(
      `⏳ Doctor ${selectedDoctor.phone} did not accept, reassigning...`
    );
    updateUserStatus(selectedDoctor.phone, "doctor", "online");
    io.emit("doctor:list", findAvailableDoctors());
    attemptCallToNextDoctor(socket, patientPhone, doctorQueue, io);
  }, CALL_TIMEOUT);
};

const clearPendingCall = (phone) => {
  if (pendingCalls[phone]) {
    clearTimeout(pendingCalls[phone]);
    delete pendingCalls[phone];
  }
};

module.exports = { initializeWebSocket };
