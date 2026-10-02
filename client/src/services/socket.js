import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem("ecp_token");
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: { token },
      query: { token },
    });
  }
  return socketInstance;
};

export const joinDepartmentRoom = (department) => {
  const socket = getSocket();
  if (socket && department) {
    socket.emit("join-department", department);
  }
};

export const joinAdminRoom = () => {
  const socket = getSocket();
  if (socket) {
    socket.emit("join-admin");
  }
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
