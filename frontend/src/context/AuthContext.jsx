import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = localStorage.getItem('user');
      
      // If we have user data in localStorage, set it immediately
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Then verify with the server in the background
        // But don't wait for it to set loading to false
        authAPI.profile()
          .then(response => {
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          })
          .catch(error => {
            console.error('Profile check failed:', error);
            localStorage.removeItem('user');
            setUser(null);
          });
      } else {
        // No user data in localStorage, try to get profile anyway
        const response = await authAPI.profile();
        setUser(response.data.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Alternative simpler version - try this if above doesn't work:
  /*
  const checkAuth = async () => {
    try {
      const userData = localStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
      
      // Don't wait for profile check on initial load
      setLoading(false);
      
      // Check profile in background
      setTimeout(async () => {
        try {
          const response = await authAPI.profile();
          setUser(response.data.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        } catch (error) {
          console.error('Background auth check failed:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      }, 100);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  };
  */

  const register = async (userData) => {
    try {
      console.log('AuthContext: Attempting register with data:', userData);
      const response = await authAPI.register(userData);
      console.log('AuthContext: Register response:', response.data);
      
      const { user } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthContext: Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Registration failed' 
      };
    }
  };

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Attempting login with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('AuthContext: Login response:', response.data);
      
      const { user } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthContext: Login error details:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.status === 422) {
        errorMessage = 'Validation error: Check your input';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Login failed';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Role checking helper functions
  const isAdmin = () => user?.role === 'admin';
  const isSupplyOfficer = () => user?.role === 'supply_officer';
  const isStaff = () => user?.role === 'staff';
  
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const canManageUsers = () => isAdmin();
  const canManageInventory = () => isAdmin() || isSupplyOfficer();
  const canApproveRequests = () => isAdmin() || isSupplyOfficer();

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
    
    // Role checking functions
    isAdmin,
    isSupplyOfficer,
    isStaff,
    hasRole,
    canManageUsers,
    canManageInventory,
    canApproveRequests,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
/*
import api from "./axios"

export const login = async(email, password) => {
  return api.post('/api/login, {email, password});
  };

export const register = async(data) => {
  return api.post('/api/register, data);
  };

export const logout = async() => {
  return api.post('/api/login);
  };

export const getCars = async () => {
  return api.get('/api/v1/cars');
  };

*/