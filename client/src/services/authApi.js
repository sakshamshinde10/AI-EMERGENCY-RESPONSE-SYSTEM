import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const loginUser = async (username, password) => {
  const response = await axios.post(`${API}/login`, { username, password });
  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await axios.get(`${API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
