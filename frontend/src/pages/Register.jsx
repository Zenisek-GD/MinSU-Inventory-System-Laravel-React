import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/Auth";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "staff",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register(formData);
      console.log("Register response:", res.data);
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err);
      setError(
        err.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Register</h1>

        <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border mb-4" />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border mb-4" />
        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border mb-4" />
        <input name="password_confirmation" type="password" placeholder="Confirm Password" value={formData.password_confirmation} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border mb-4" />
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg">{loading ? "Registering..." : "Register"}</button>
      </form>
    </div>
  );
}
