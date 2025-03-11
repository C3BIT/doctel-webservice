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
const activeCalls = {};
const rejectedDoctors = {};

const initializeWebSocket = (server) => {
  const io = socketIo(server, { cors: { origin: "*" } });
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { id, role, phone } = socket.user;
    const socketId = socket.id.toString();

    console.log(
      `✅ User connected: ${socketId} | Role: ${role} | Phone: ${phone}`
    );
    addUser(phone, role, socketId);
    io.emit("doctor:list", findAvailableDoctors());
    console.log(
      "Online users:",
      JSON.stringify(getOnlineUsersWithInfo(), null, 2)
    );

    socket.on("call:initiate", () => {
      if (role !== "patient") return;

      console.log(`🔄 Patient ${phone} initiating call`);
      clearActiveCall(phone);
      rejectedDoctors[phone] = new Set();

      let availableDoctors = findAvailableDoctors();
      console.log(
        `📋 Available doctors: ${JSON.stringify(
          availableDoctors.map((d) => d.phone)
        )}`
      );

      if (availableDoctors.length === 0) {
        console.log(`❌ No doctors available for patient ${phone}`);
        socket.emit("call:failed", {
          message: "No doctors available at this moment",
        });
        return;
      }
      activeCalls[phone] = {
        inProgress: true,
        patientSocketId: socketId,
        attemptedDoctors: new Set(),
        currentDoctorPhone: null,
        timeout: null,
        startTime: Date.now(),
      };

      attemptCallToNextDoctor(socket, phone, [...availableDoctors], io); // Clone the array to avoid mutation issues
    });

    socket.on("call:accept", () => {
      if (role !== "doctor") return;

      const patientPhone = socket.user.patientPhone;

      console.log(
        `✅ Doctor ${phone} accepting call from patient ${patientPhone}`
      );

      if (!activeCalls[patientPhone]?.inProgress) {
        console.log(`⚠️ Call no longer active for patient ${patientPhone}`);
        return;
      }

      const routingTime = Date.now() - activeCalls[patientPhone].startTime;
      console.log(
        `⏱️ Call routing time: ${routingTime}ms for patient ${patientPhone} to doctor ${phone}`
      );

      activeCalls[patientPhone].inProgress = false;

      if (activeCalls[patientPhone].timeout) {
        console.log(`🔄 Clearing timeout for patient ${patientPhone}`);
        clearTimeout(activeCalls[patientPhone].timeout);
        activeCalls[patientPhone].timeout = null;
      }

      updateUserStatus(phone, role, "busy");
      io.emit("doctor:list", findAvailableDoctors());

      io.to(activeCalls[patientPhone].patientSocketId).emit("call:accepted", {
        doctorId: phone,
        routingTime: routingTime,
      });

      console.log(
        `🔄 Call accepted: Patient ${patientPhone} connected with Doctor ${phone}`
      );
    });

    socket.on("call:reject", () => {
      if (role !== "doctor") return;

      const patientPhone = socket.user.patientPhone;
      console.log(
        `❌ Doctor ${phone} rejected call from patient ${patientPhone}`
      );

      if (!activeCalls[patientPhone] || !activeCalls[patientPhone].inProgress) {
        console.log(`⚠️ Call no longer active for patient ${patientPhone}`);
        return;
      }
      if (activeCalls[patientPhone].timeout) {
        console.log(
          `🔄 Clearing timeout for patient ${patientPhone} after rejection`
        );
        clearTimeout(activeCalls[patientPhone].timeout);
        activeCalls[patientPhone].timeout = null;
      }

      updateUserStatus(phone, role, "online");

      if (!rejectedDoctors[patientPhone]) {
        rejectedDoctors[patientPhone] = new Set();
      }
      rejectedDoctors[patientPhone].add(phone);

      activeCalls[patientPhone].attemptedDoctors.add(phone);
      socket.emit("call:reassigned", {
        message: "Call has been reassigned to another doctor",
        patientId: patientPhone,
      });

      console.log(`📣 Notified doctor ${phone} about call reassignment`);

      let availableDoctors = findAvailableDoctors().filter(
        (doc) => !rejectedDoctors[patientPhone].has(doc.phone)
      );

      console.log(
        `📋 Remaining available doctors: ${JSON.stringify(
          availableDoctors.map((d) => d.phone)
        )}`
      );

      io.emit("doctor:list", findAvailableDoctors());

      if (availableDoctors.length > 0) {
        const patientSocket = io.sockets.sockets.get(
          activeCalls[patientPhone].patientSocketId
        );

        if (patientSocket) {
          console.log(
            `🔄 Immediately attempting call to next doctor for patient ${patientPhone}`
          );
          attemptCallToNextDoctor(
            patientSocket,
            patientPhone,
            [...availableDoctors],
            io
          );
        } else {
          console.log(`⚠️ Patient socket not found for ${patientPhone}`);
          clearActiveCall(patientPhone);
        }
      } else {
        console.log(`❌ No more available doctors for patient ${patientPhone}`);
        const patientSocket = io.sockets.sockets.get(
          activeCalls[patientPhone].patientSocketId
        );
        if (patientSocket) {
          patientSocket.emit("call:failed", {
            message: "No doctors available at this moment",
          });
        }
        clearActiveCall(patientPhone);
      }
    });

    socket.on("doctor:busy", () => {
      if (role === "doctor") {
        console.log(`🔄 Doctor ${phone} set status to busy`);
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("doctor:free", () => {
      if (role === "doctor") {
        console.log(`🔄 Doctor ${phone} set status to online`);
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("call:end", () => {
      if (role === "patient") {
        console.log(`🔄 Patient ${phone} ended call`);
        clearActiveCall(phone);
      } else if (role === "doctor") {
        const patientPhone = socket.user.patientPhone;
        if (patientPhone && activeCalls[patientPhone]) {
          console.log(
            `🔄 Doctor ${phone} ended call with patient ${patientPhone}`
          );
          io.to(activeCalls[patientPhone].patientSocketId).emit("call:ended", {
            doctorId: phone,
          });
        }

        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `❌ User disconnected: ${socketId} | Role: ${role} | Phone: ${phone}`
      );

      if (role === "patient") {
        clearActiveCall(phone);
      } else if (role === "doctor") {
        Object.keys(activeCalls).forEach((patientPhone) => {
          if (activeCalls[patientPhone].currentDoctorPhone === phone) {
            console.log(
              `📣 Notifying patient ${patientPhone} about doctor ${phone} disconnection`
            );
            io.to(activeCalls[patientPhone].patientSocketId).emit(
              "doctor:disconnected",
              {
                doctorId: phone,
              }
            );
          }
        });
      }
      removeUser(socketId);
      io.emit("doctor:list", findAvailableDoctors());
    });
  });
};

const attemptCallToNextDoctor = (socket, patientPhone, doctorQueue, io) => {
  console.log(`🔄 Attempting to find next doctor for patient ${patientPhone}`);
  console.log(`📋 Doctor queue length: ${doctorQueue.length}`);

  if (!socket || !patientPhone || !activeCalls[patientPhone]) {
    console.log(`⚠️ Invalid call attempt state for patient ${patientPhone}`);
    return;
  }

  if (doctorQueue.length === 0) {
    console.log(`❌ No more doctors in queue for patient ${patientPhone}`);
    socket.emit("call:failed", {
      message: "No available doctors at this moment",
    });
    clearActiveCall(patientPhone);
    return;
  }

  const selectedDoctor = doctorQueue.shift();
  console.log(
    `🔄 Selected doctor ${selectedDoctor.phone} for patient ${patientPhone}`
  );

  if (
    activeCalls[patientPhone].attemptedDoctors.has(selectedDoctor.phone) ||
    rejectedDoctors[patientPhone]?.has(selectedDoctor.phone)
  ) {
    console.log(
      `⚠️ Doctor ${selectedDoctor.phone} was already attempted or rejected, trying next`
    );
    return attemptCallToNextDoctor(socket, patientPhone, doctorQueue, io);
  }

  activeCalls[patientPhone].attemptedDoctors.add(selectedDoctor.phone);

  activeCalls[patientPhone].currentDoctorPhone = selectedDoctor.phone;

  const roomId = crypto
    .createHash("sha256")
    .update(`${patientPhone}_${selectedDoctor.phone}_${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  const jitsiRoomLink = `https://call.bloomattires.com/${roomId}`;

  const doctorSocket = io.sockets.sockets.get(selectedDoctor.socketId);
  if (doctorSocket) {
    doctorSocket.user.patientPhone = patientPhone;
  }

  io.to(selectedDoctor.socketId).emit("call:request", {
    patientId: patientPhone,
    patientSocketId: activeCalls[patientPhone].patientSocketId,
    jitsiRoom: jitsiRoomLink,
  });

  io.to(activeCalls[patientPhone].patientSocketId).emit("call:initiated", {
    doctorId: selectedDoctor.phone,
    jitsiRoom: jitsiRoomLink,
  });

  console.log(
    `📞 Call initiated: Patient ${patientPhone} → Doctor ${selectedDoctor.phone}`
  );
  console.log(`🔗 Jitsi Room: ${jitsiRoomLink}`);

  updateUserStatus(selectedDoctor.phone, "doctor", "busy");
  io.emit("doctor:list", findAvailableDoctors());
  if (activeCalls[patientPhone].timeout) {
    clearTimeout(activeCalls[patientPhone].timeout);
  }

  activeCalls[patientPhone].timeout = setTimeout(() => {
    console.log(
      `⏳ Doctor ${selectedDoctor.phone} did not respond in time to patient ${patientPhone}`
    );

    if (!activeCalls[patientPhone] || !activeCalls[patientPhone].inProgress) {
      console.log(
        `⚠️ Call no longer active for patient ${patientPhone} - timeout handler`
      );
      return;
    }

    if (activeCalls[patientPhone].currentDoctorPhone !== selectedDoctor.phone) {
      console.log(
        `⚠️ Doctor changed during timeout for patient ${patientPhone}`
      );
      return;
    }

    const doctorSocket = io.sockets.sockets.get(selectedDoctor.socketId);
    if (doctorSocket) {
      doctorSocket.emit("call:reassigned", {
        message: "Call has been reassigned due to response timeout",
        patientId: patientPhone,
      });
      console.log(
        `📣 Notified doctor ${selectedDoctor.phone} about timeout reassignment`
      );
    }

    updateUserStatus(selectedDoctor.phone, "doctor", "online");
    io.emit("doctor:list", findAvailableDoctors());

    let availableDoctors = findAvailableDoctors().filter(
      (doc) => !activeCalls[patientPhone].attemptedDoctors.has(doc.phone)
    );

    console.log(
      `📋 Remaining available doctors after timeout: ${JSON.stringify(
        availableDoctors.map((d) => d.phone)
      )}`
    );

    if (availableDoctors.length > 0) {
      console.log(
        `🔄 Attempting next doctor after timeout for patient ${patientPhone}`
      );
      attemptCallToNextDoctor(socket, patientPhone, [...availableDoctors], io);
    } else {
      console.log(
        `❌ No more available doctors after timeout for patient ${patientPhone}`
      );
      socket.emit("call:failed", {
        message: "No doctors available at this moment",
      });
      clearActiveCall(patientPhone);
    }
  }, CALL_TIMEOUT);

  console.log(
    `⏱️ Set ${CALL_TIMEOUT}ms timeout for doctor ${selectedDoctor.phone} to respond to patient ${patientPhone}`
  );
};

const clearActiveCall = (patientPhone) => {
  if (!activeCalls[patientPhone]) return;

  console.log(`🧹 Clearing active call for patient ${patientPhone}`);

  if (activeCalls[patientPhone].timeout) {
    clearTimeout(activeCalls[patientPhone].timeout);
    console.log(`🔄 Cleared timeout for patient ${patientPhone}`);
  }

  const currentDoctorPhone = activeCalls[patientPhone].currentDoctorPhone;
  if (currentDoctorPhone) {
    console.log(
      `🔄 Resetting status of doctor ${currentDoctorPhone} to online`
    );
    updateUserStatus(currentDoctorPhone, "doctor", "online");
  }

  delete rejectedDoctors[patientPhone];

  delete activeCalls[patientPhone];
  console.log(`✅ Successfully cleared call state for patient ${patientPhone}`);
};

module.exports = { initializeWebSocket };
