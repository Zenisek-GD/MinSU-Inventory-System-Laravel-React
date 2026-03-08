import api from "../api/axios";
import axios from "axios";

// Initialize CSRF token on app load
const initializeCsrfToken = async () => {
  try {
    await axios.get("http://localhost:8000/sanctum/csrf-cookie", {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
  }
};

export const login = async (formData) => {
  try {
    // 1️⃣ Get CSRF token cookie (required by Sanctum)
    await initializeCsrfToken();

    // 2️⃣ Login (Laravel will set the session cookie automatically)
    const response = await api.post("/login", formData, {
      withCredentials: true,
    });

    return response.data; // returns user or message from backend
  } catch (error) {
    if (error.response) {
      console.error("Login failed:", error.response.data);
      throw error.response.data;
    } else {
      throw error;
    }
  }
};