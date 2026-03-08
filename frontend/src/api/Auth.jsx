import api from "../api/axios"; // your Axios instance with baseURL and withCredentials
import axios from "axios";

export const getCsrfCookie = async () => {
  try {
    return await axios.get("http://localhost:8000/sanctum/csrf-cookie", {
      withCredentials: true,
    });
  } catch (error) {
    console.error('CSRF cookie error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    await getCsrfCookie(); // ✅ ensure CSRF cookie is set
    const response = await api.post("/login", credentials, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const register = async (data) => {
  try {
    await getCsrfCookie(); // ✅ ensure CSRF cookie is set
    const response = await api.post("/register", data, { withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/logout", {}, { withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get("/profile", { withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};
