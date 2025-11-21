import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getProfile } from "../api/Auth";
import { useUser } from "../context/UserContext";

export default function LoginForm() {
  const navigate = useNavigate();
  const { setUser } = useUser();
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
      await login(formData);
      const profile = await getProfile();
      setUser(profile.data.data.user);
      navigate("/dashboard");
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
    <div className="min-h-screen bg-gradient-to-r from-green-50 to-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex overflow-hidden border border-gray-200">
        <div className="w-2/5 bg-gradient-to-b from-[#006400] to-[#004d00] p-12 flex flex-col justify-between text-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-400 p-3 mb-6">
              <img 
                src="src/assets/minsu-logo.png" 
                alt="MinSU Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="text-[#006400] font-bold text-3xl hidden">M</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Mindoro State University</h1>
            <p className="text-amber-200 text-lg font-medium mb-8">Inventory Management System</p>
            
            <div className="w-20 h-1 bg-amber-400 rounded-full mb-8"></div>
            
            <div className="space-y-4 text-amber-100">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <span>Track Inventory Items</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <span>Manage Purchase Requests</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <span>Streamline Operations</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-amber-200 text-sm">
              Efficient • Secure • Reliable
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-3/5 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome Back</h2>
              <p className="text-gray-600 text-lg">Sign in to your institutional account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Institutional Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@minsu.edu.ph"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-[#006400] focus:border-[#006400] transition-all duration-200 bg-gray-50 text-gray-800 text-lg"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-[#006400] focus:border-[#006400] transition-all duration-200 bg-gray-50 text-gray-800 text-lg"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#006400] to-[#004d00] hover:from-[#004d00] hover:to-[#003800] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  For account assistance, contact the <br />
                  <a 
                    href="/contact" 
                    className="text-[#006400] hover:text-[#004d00] font-bold transition-colors duration-200 text-base"
                  >
                    System Administrator
                  </a>
                </p>
                <p className="text-gray-500 text-xs mt-3">
                  MinSU Inventory System v2.0 • Secure Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}