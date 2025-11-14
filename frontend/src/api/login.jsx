import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.headers.common["Content-Type"] = "application/json";

// 👇 These two lines fix CSRF token mismatch
axios.defaults.xsrfCookieName = "XSRF-TOKEN";
axios.defaults.xsrfHeaderName = "X-XSRF-TOKEN";


export const login = async (formData) => {
  try {
    // 1️⃣ Get CSRF token cookie (required by Sanctum)
    await axios.get("http://localhost:8000/sanctum/csrf-cookie", {
      withCredentials: true,
    });

    // 2️⃣ Login (Laravel will set the session cookie automatically)
    const response = await axios.post("http://localhost:8000/login", formData, {
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