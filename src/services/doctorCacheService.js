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

const findAvailableDoctors = () => {
  return doctorCache.keys()
    .map((key) => doctorCache.get(key))
    .filter((user) => user?.role === "doctor" && user?.status === "online");
};

const getOnlineUsersWithInfo = () => {
  return doctorCache.keys().map((key) => {
    const user = doctorCache.get(key);
    return {
      key,
      phone: user.phone,
      role: user.role,
      status: user.status,
      socketId: user.socketId,
    };
  });
};

module.exports = {
  addUser,
  updateUserStatus,
  removeUser,
  findAvailableDoctors,
  getOnlineUsersWithInfo,
};
