import axios from "../api/axios"; // your Axios instance with baseURL and withCredentials

export const getCsrfCookie = async () => {
  return axios.get("http://localhost:8000/sanctum/csrf-cookie", {
    withCredentials: true,
  });
};

export const login = async (credentials) => {
  await getCsrfCookie(); // ✅ ensure CSRF cookie is set
  return axios.post("/login", credentials, { withCredentials: true });
};

export const register = async (data) => {
  await getCsrfCookie(); // ✅ ensure CSRF cookie is set
  return axios.post("/register", data, { withCredentials: true });
};

export const logout = async () => {
  return axios.post("/logout", {}, { withCredentials: true });
};

export const getProfile = async () => {
  return axios.get("/profile", { withCredentials: true });
};
