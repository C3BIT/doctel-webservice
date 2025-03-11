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
const activeCalls = {}; // Track active call attempts by patient phone
const rejectedDoctors = {}; // Track rejected doctors per patient

const initializeWebSocket = (server) => {
  const io = socketIo(server, { cors: { origin: "*" } });
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { id, role, phone } = socket.user;
    const socketId = socket.id.toString();

    console.log(`✅ User connected: ${socketId} | Role: ${role}`);
    addUser(phone, role, socketId);
    io.emit("doctor:list", findAvailableDoctors());
    console.log(
      "==============getOnlineUsersWithInfo===============",
      getOnlineUsersWithInfo()
    );

    socket.on("call:initiate", () => {
      if (role === "patient") {
        // Clear any existing call attempts for this patient
        clearActiveCall(phone);

        // Initialize rejected doctors set for this patient
        rejectedDoctors[phone] = new Set();

        let availableDoctors = findAvailableDoctors();
        console.log(
          "==============call initiated===========",
          availableDoctors
        );

        if (availableDoctors.length === 0) {
          socket.emit("call:failed", {
            message: "No doctors available at this moment",
          });
          return;
        }

        // Track this as an active call attempt
        activeCalls[phone] = {
          inProgress: true,
          patientSocketId: socketId,
          attemptedDoctors: new Set(),
          timeout: null,
        };

        attemptCallToNextDoctor(socket, phone, availableDoctors, io);
      }
    });

    socket.on("call:accept", () => {
      if (role === "doctor") {
        const patientPhone = socket.user.patientPhone;

        // Only proceed if this is still an active call
        if (activeCalls[patientPhone]?.inProgress) {
          // Mark call as no longer in progress to prevent further attempts
          activeCalls[patientPhone].inProgress = false;

          // Clear any pending timeout
          if (activeCalls[patientPhone].timeout) {
            clearTimeout(activeCalls[patientPhone].timeout);
          }

          updateUserStatus(phone, role, "busy");
          io.emit("doctor:list", findAvailableDoctors());

          // Notify the patient that the call was accepted
          io.to(activeCalls[patientPhone].patientSocketId).emit(
            "call:accepted",
            {
              doctorId: phone,
            }
          );
        }
      }
    });

    socket.on("call:reject", () => {
      console.log("==============call rejected===========", socketId);
      if (role === "doctor") {
        const patientPhone = socket.user.patientPhone;

        // Only proceed if this is still an active call
        if (
          !activeCalls[patientPhone] ||
          !activeCalls[patientPhone].inProgress
        ) {
          return;
        }

        // Update doctor status back to online
        updateUserStatus(phone, role, "online");

        // Add to rejected doctors set
        if (!rejectedDoctors[patientPhone]) {
          rejectedDoctors[patientPhone] = new Set();
        }
        rejectedDoctors[patientPhone].add(phone);

        // Also add to attempted doctors set
        activeCalls[patientPhone].attemptedDoctors.add(phone);

        // Find available doctors excluding those who already rejected
        let availableDoctors = findAvailableDoctors().filter(
          (doc) => !rejectedDoctors[patientPhone].has(doc.phone)
        );

        io.emit("doctor:list", findAvailableDoctors());

        if (availableDoctors.length > 0) {
          // Clear any existing timeout before attempting next doctor
          if (activeCalls[patientPhone].timeout) {
            clearTimeout(activeCalls[patientPhone].timeout);
          }

          attemptCallToNextDoctor(
            io.sockets.sockets.get(activeCalls[patientPhone].patientSocketId),
            patientPhone,
            availableDoctors,
            io
          );
        } else {
          io.to(activeCalls[patientPhone].patientSocketId).emit("call:failed", {
            message: "No doctors available at this moment",
          });
          clearActiveCall(patientPhone);
        }
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

    socket.on("call:end", () => {
      // Handle call ending - both doctors and patients can end calls
      if (role === "patient") {
        clearActiveCall(phone);
      } else if (role === "doctor") {
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    socket.on("disconnect", () => {
      // If a patient disconnects, clear their active calls
      if (role === "patient") {
        clearActiveCall(phone);
      }

      // If a doctor disconnects, update available doctors list
      removeUser(socketId);
      io.emit("doctor:list", findAvailableDoctors());
    });
  });
};

const attemptCallToNextDoctor = (socket, patientPhone, doctorQueue, io) => {
  console.log("==========doctorQueue=========", doctorQueue);

  // Guard against invalid state
  if (!socket || !patientPhone || !activeCalls[patientPhone]) {
    console.log(`Invalid call attempt state for patient ${patientPhone}`);
    return;
  }

  // Check if we have any doctors left to try
  if (doctorQueue.length === 0) {
    socket.emit("call:failed", {
      message: "No available doctors at this moment",
    });
    clearActiveCall(patientPhone);
    return;
  }

  const selectedDoctor = doctorQueue.shift();

  // Check if we've already tried this doctor (defensive check)
  if (
    activeCalls[patientPhone].attemptedDoctors.has(selectedDoctor.phone) ||
    rejectedDoctors[patientPhone]?.has(selectedDoctor.phone)
  ) {
    // Skip this doctor and try the next one
    return attemptCallToNextDoctor(socket, patientPhone, doctorQueue, io);
  }

  // Mark this doctor as attempted
  activeCalls[patientPhone].attemptedDoctors.add(selectedDoctor.phone);

  // Create room ID for this call
  const roomId = crypto
    .createHash("sha256")
    .update(`${patientPhone}_${selectedDoctor.phone}`)
    .digest("hex")
    .slice(0, 16);
  const jitsiRoomLink = `https://call.bloomattires.com/${roomId}`;

  // Send call request to doctor
  io.to(selectedDoctor.socketId).emit("call:request", {
    patientId: patientPhone,
    patientSocketId: activeCalls[patientPhone].patientSocketId,
    jitsiRoom: jitsiRoomLink,
  });

  // Notify patient that we're trying this doctor
  io.to(activeCalls[patientPhone].patientSocketId).emit("call:initiated", {
    doctorId: selectedDoctor.phone,
    jitsiRoom: jitsiRoomLink,
  });

  console.log(
    `📞 Call initiated: Patient ${patientPhone} → Doctor ${selectedDoctor.phone}`
  );
  console.log(`🔗 Jitsi Room: ${jitsiRoomLink}`);

  // Mark the doctor as busy temporarily
  updateUserStatus(selectedDoctor.phone, "doctor", "busy");
  io.emit("doctor:list", findAvailableDoctors());

  // Set timeout for doctor response
  activeCalls[patientPhone].timeout = setTimeout(() => {
    console.log(
      `⏳ Doctor ${selectedDoctor.phone} did not respond in time, reassigning...`
    );

    // If call is no longer active, don't proceed
    if (!activeCalls[patientPhone] || !activeCalls[patientPhone].inProgress) {
      return;
    }

    // Mark the doctor as attempted but not explicitly rejected
    activeCalls[patientPhone].attemptedDoctors.add(selectedDoctor.phone);

    // Set the doctor back to online
    updateUserStatus(selectedDoctor.phone, "doctor", "online");
    io.emit("doctor:list", findAvailableDoctors());

    // Get fresh list of available doctors excluding already attempted ones
    let availableDoctors = findAvailableDoctors().filter(
      (doc) => !activeCalls[patientPhone].attemptedDoctors.has(doc.phone)
    );

    if (availableDoctors.length > 0) {
      attemptCallToNextDoctor(socket, patientPhone, availableDoctors, io);
    } else {
      io.to(activeCalls[patientPhone].patientSocketId).emit("call:failed", {
        message: "No doctors available at this moment",
      });
      clearActiveCall(patientPhone);
    }
  }, CALL_TIMEOUT);
};

const clearActiveCall = (patientPhone) => {
  if (activeCalls[patientPhone]) {
    // Clear any pending timeout
    if (activeCalls[patientPhone].timeout) {
      clearTimeout(activeCalls[patientPhone].timeout);
    }

    // Clean up rejected doctors tracking
    delete rejectedDoctors[patientPhone];

    // Remove active call entry
    delete activeCalls[patientPhone];
  }
};

module.exports = { initializeWebSocket };
