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

const CALL_TIMEOUT = 30000; // 30 seconds timeout for doctor response
const activeCalls = {}; // Track active call attempts by patient phone
const rejectedDoctors = {}; // Track rejected doctors per patient

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

    // Patient initiates a call
    socket.on("call:initiate", () => {
      if (role !== "patient") return;

      console.log(`🔄 Patient ${phone} initiating call`);

      // Clear any existing call attempts for this patient
      clearActiveCall(phone);

      // Initialize rejected doctors set for this patient
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

      // Track this as an active call attempt
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

    // Doctor accepts a call
    socket.on("call:accept", () => {
      if (role !== "doctor") return;

      const patientPhone = socket.user.patientPhone;

      console.log(
        `✅ Doctor ${phone} accepting call from patient ${patientPhone}`
      );

      // Only proceed if this is still an active call
      if (!activeCalls[patientPhone]?.inProgress) {
        console.log(`⚠️ Call no longer active for patient ${patientPhone}`);
        return;
      }

      // Calculate and log call routing time
      const routingTime = Date.now() - activeCalls[patientPhone].startTime;
      console.log(
        `⏱️ Call routing time: ${routingTime}ms for patient ${patientPhone} to doctor ${phone}`
      );

      // Mark call as no longer in progress to prevent further attempts
      activeCalls[patientPhone].inProgress = false;

      // Clear any pending timeout
      if (activeCalls[patientPhone].timeout) {
        console.log(`🔄 Clearing timeout for patient ${patientPhone}`);
        clearTimeout(activeCalls[patientPhone].timeout);
        activeCalls[patientPhone].timeout = null;
      }

      updateUserStatus(phone, role, "busy");
      io.emit("doctor:list", findAvailableDoctors());

      // Notify the patient that the call was accepted
      io.to(activeCalls[patientPhone].patientSocketId).emit("call:accepted", {
        doctorId: phone,
        routingTime: routingTime,
      });

      console.log(
        `🔄 Call accepted: Patient ${patientPhone} connected with Doctor ${phone}`
      );
    });

    // Doctor rejects a call
    socket.on("call:reject", () => {
      if (role !== "doctor") return;

      const patientPhone = socket.user.patientPhone;
      console.log(
        `❌ Doctor ${phone} rejected call from patient ${patientPhone}`
      );

      // Only proceed if this is still an active call
      if (!activeCalls[patientPhone] || !activeCalls[patientPhone].inProgress) {
        console.log(`⚠️ Call no longer active for patient ${patientPhone}`);
        return;
      }

      // CRITICAL: Clear any existing timeout immediately to prevent race conditions
      if (activeCalls[patientPhone].timeout) {
        console.log(
          `🔄 Clearing timeout for patient ${patientPhone} after rejection`
        );
        clearTimeout(activeCalls[patientPhone].timeout);
        activeCalls[patientPhone].timeout = null;
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

      // Send acknowledgment to the doctor that the call has been reassigned
      socket.emit("call:reassigned", {
        message: "Call has been reassigned to another doctor",
        patientId: patientPhone,
      });

      console.log(`📣 Notified doctor ${phone} about call reassignment`);

      // Get up-to-date available doctors excluding those who already rejected
      let availableDoctors = findAvailableDoctors().filter(
        (doc) => !rejectedDoctors[patientPhone].has(doc.phone)
      );

      console.log(
        `📋 Remaining available doctors: ${JSON.stringify(
          availableDoctors.map((d) => d.phone)
        )}`
      );

      // Update available doctors list
      io.emit("doctor:list", findAvailableDoctors());

      if (availableDoctors.length > 0) {
        const patientSocket = io.sockets.sockets.get(
          activeCalls[patientPhone].patientSocketId
        );

        if (patientSocket) {
          console.log(
            `🔄 Immediately attempting call to next doctor for patient ${patientPhone}`
          );
          // CRUCIAL: Immediately attempt call to next doctor WITHOUT waiting
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

    // Doctor sets status to busy
    socket.on("doctor:busy", () => {
      if (role === "doctor") {
        console.log(`🔄 Doctor ${phone} set status to busy`);
        updateUserStatus(phone, role, "busy");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    // Doctor sets status to free/online
    socket.on("doctor:free", () => {
      if (role === "doctor") {
        console.log(`🔄 Doctor ${phone} set status to online`);
        updateUserStatus(phone, role, "online");
        io.emit("doctor:list", findAvailableDoctors());
      }
    });

    // Either party ends the call
    socket.on("call:end", () => {
      if (role === "patient") {
        console.log(`🔄 Patient ${phone} ended call`);
        clearActiveCall(phone);
      } else if (role === "doctor") {
        // Notify patient if applicable
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

    // Handle disconnections
    socket.on("disconnect", () => {
      console.log(
        `❌ User disconnected: ${socketId} | Role: ${role} | Phone: ${phone}`
      );

      // If a patient disconnects, clear their active calls
      if (role === "patient") {
        clearActiveCall(phone);
      } else if (role === "doctor") {
        // If this doctor was in an active call, notify the patient
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

      // Update available doctors list
      removeUser(socketId);
      io.emit("doctor:list", findAvailableDoctors());
    });
  });
};

// Main function to attempt call to next available doctor
const attemptCallToNextDoctor = (socket, patientPhone, doctorQueue, io) => {
  console.log(`🔄 Attempting to find next doctor for patient ${patientPhone}`);
  console.log(`📋 Doctor queue length: ${doctorQueue.length}`);

  // Guard against invalid state
  if (!socket || !patientPhone || !activeCalls[patientPhone]) {
    console.log(`⚠️ Invalid call attempt state for patient ${patientPhone}`);
    return;
  }

  // Check if we have any doctors left to try
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

  // Check if we've already tried this doctor (defensive check)
  if (
    activeCalls[patientPhone].attemptedDoctors.has(selectedDoctor.phone) ||
    rejectedDoctors[patientPhone]?.has(selectedDoctor.phone)
  ) {
    console.log(
      `⚠️ Doctor ${selectedDoctor.phone} was already attempted or rejected, trying next`
    );
    // Skip this doctor and try the next one
    return attemptCallToNextDoctor(socket, patientPhone, doctorQueue, io);
  }

  // Mark this doctor as attempted
  activeCalls[patientPhone].attemptedDoctors.add(selectedDoctor.phone);

  // Track the current doctor assigned to this call
  activeCalls[patientPhone].currentDoctorPhone = selectedDoctor.phone;

  // Create room ID for this call
  const roomId = crypto
    .createHash("sha256")
    .update(`${patientPhone}_${selectedDoctor.phone}_${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  const jitsiRoomLink = `https://call.bloomattires.com/${roomId}`;

  // Add the doctor's patient reference for this call
  // This is crucial for the doctor to know which patient they're dealing with
  const doctorSocket = io.sockets.sockets.get(selectedDoctor.socketId);
  if (doctorSocket) {
    doctorSocket.user.patientPhone = patientPhone;
  }

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

  // IMPORTANT: Clear any existing timeout before setting a new one
  if (activeCalls[patientPhone].timeout) {
    clearTimeout(activeCalls[patientPhone].timeout);
  }

  // Set timeout for doctor response
  activeCalls[patientPhone].timeout = setTimeout(() => {
    console.log(
      `⏳ Doctor ${selectedDoctor.phone} did not respond in time to patient ${patientPhone}`
    );

    // If call is no longer active, don't proceed
    if (!activeCalls[patientPhone] || !activeCalls[patientPhone].inProgress) {
      console.log(
        `⚠️ Call no longer active for patient ${patientPhone} - timeout handler`
      );
      return;
    }

    // Ensure this is still the current doctor assigned
    if (activeCalls[patientPhone].currentDoctorPhone !== selectedDoctor.phone) {
      console.log(
        `⚠️ Doctor changed during timeout for patient ${patientPhone}`
      );
      return;
    }

    // Notify doctor about the reassignment due to timeout
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

    // Set the doctor back to online
    updateUserStatus(selectedDoctor.phone, "doctor", "online");
    io.emit("doctor:list", findAvailableDoctors());

    // Get fresh list of available doctors excluding already attempted ones
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

  // Clear any pending timeout
  if (activeCalls[patientPhone].timeout) {
    clearTimeout(activeCalls[patientPhone].timeout);
    console.log(`🔄 Cleared timeout for patient ${patientPhone}`);
  }

  // Reset status of the current doctor if applicable
  const currentDoctorPhone = activeCalls[patientPhone].currentDoctorPhone;
  if (currentDoctorPhone) {
    console.log(
      `🔄 Resetting status of doctor ${currentDoctorPhone} to online`
    );
    updateUserStatus(currentDoctorPhone, "doctor", "online");
  }

  // Clean up rejected doctors tracking
  delete rejectedDoctors[patientPhone];

  // Remove active call entry
  delete activeCalls[patientPhone];
  console.log(`✅ Successfully cleared call state for patient ${patientPhone}`);
};

module.exports = { initializeWebSocket };
