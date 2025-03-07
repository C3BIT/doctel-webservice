const { doctorCache } = require("../utils/memoryCache");

const addUser = (id, role, socketId) => {
  doctorCache.set(id, {
    socketId,
    role,
    status: role === "doctor" ? "online" : "patient",
  });
};

const updateUserStatus = (id, status) => {
  let user = doctorCache.get(id);
  if (user && user.role === "doctor") {
    user.status = status;
    doctorCache.set(id, user);
  }
};

const removeUser = (socketId) => {
  doctorCache.keys().forEach((id) => {
    if (doctorCache.get(id)?.socketId === socketId) {
      doctorCache.del(id);
    }
  });
};

const findAvailableDoctor = () => {
  return doctorCache.keys().find((id) => {
    const user = doctorCache.get(id);
    return user?.role === "doctor" && user?.status === "online";
  });
};

const getOnlineUsersWithInfo = () => {
  const users = doctorCache.mget(doctorCache.keys());
  return Object.entries(users).map(([id, data]) => ({
      id,
      role: data.role,
      status: data.status
  }));
};

module.exports = { addUser, updateUserStatus, removeUser, findAvailableDoctor, getOnlineUsersWithInfo };
