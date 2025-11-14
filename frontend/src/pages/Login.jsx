import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getProfile } from "../api/Auth";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Submitting login:", formData);

      // 1️⃣ Login (Laravel sets session cookie)
      await login(formData);

      // 2️⃣ Get profile (cookie sent automatically)
      const profile = await getProfile();
      console.log("Profile loaded:", profile.data);

      navigate("/dashboard"); // redirect to dashboard
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        setError(err.response.data?.message || "Login failed (API error)");
      } else {
        setError("Login failed (unknown error)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Login
        </h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
