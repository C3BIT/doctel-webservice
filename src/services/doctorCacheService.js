const { doctorCache } = require("../utils/memoryCache");
const { v4: uuidv4 } = require("uuid");

const addUser = (id, role, socketId) => {
  const uniqueKey = `${role}_${uuidv4()}`;

  doctorCache.set(uniqueKey, {
    id,
    socketId,
    role,
    status: role === "doctor" ? "online" : "patient",
  });

  return uniqueKey;
};

const updateUserStatus = (uniqueKey, status) => {
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
  return doctorCache.keys().find((key) => {
    const user = doctorCache.get(key);
    return user?.role === "doctor" && user?.status === "online";
  });
};

const getOnlineUsersWithInfo = () => {
  const users = doctorCache.mget(doctorCache.keys());
  return Object.entries(users).map(([key, data]) => ({
    key,
    id: data.id,
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
