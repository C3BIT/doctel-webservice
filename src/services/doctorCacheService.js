const { doctorCache } = require("../utils/memoryCache");

const addUser = (phone, role, socketId) => {
  const uniqueKey = `${role}_${phone}`;

  doctorCache.set(uniqueKey, {
    phone,
    socketId,
    role,
    status: role === "doctor" ? "online" : "patient",
  });

  return uniqueKey;
};

const updateUserStatus = (phone, role, status) => {
  const uniqueKey = `${role}_${phone}`;
  let user = doctorCache.get(uniqueKey);
  if (user) {
    user.status = status;
    doctorCache.set(uniqueKey, user);
  }
};

const removeUser = (socketId) => {
  doctorCache.keys().forEach((key) => {
    if (doctorCache.get(key)?.socketId === socketId) {
      doctorCache.del(key);
    }
  });
};

const findAvailableDoctor = () => {
  const availableDoctors = doctorCache.keys().filter((key) => {
      const user = doctorCache.get(key);
      return user?.role === "doctor" && user?.status === "online";
  });

  if (availableDoctors.length === 0) return null;
  const selectedDoctorKey = availableDoctors[0];
  return doctorCache.get(selectedDoctorKey);
};


const getOnlineUsersWithInfo = () => {
  const users = doctorCache.mget(doctorCache.keys());
  return Object.entries(users).map(([key, data]) => ({
    key,
    phone: data.phone,
    role: data.role,
    status: data.status,
    socketId: data.socketId
  }));
};

module.exports = {
  addUser,
  updateUserStatus,
  removeUser,
  findAvailableDoctor,
  getOnlineUsersWithInfo,
};
