import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getProfile, logout } from "../api/Auth";

const UserContext = createContext();

// Configuration constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const fetchingRef = useRef(false);
  const cacheRef = useRef(null);
  const cacheTimeRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const activityListenerRef = useRef(null);
  const isLoggedOutRef = useRef(false);
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Reset inactivity timers on user activity
  const resetInactivityTimer = () => {
    if (!user || isLoggedOutRef.current) return;

    setLastActivity(Date.now());
    
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    // Hide warning if visible
    setSessionWarning(false);

    // Set warning timer (show 5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  };

  // Handle session timeout
  const handleSessionTimeout = async () => {
    isLoggedOutRef.current = true;
    setUser(null);
    setSessionWarning(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Redirect to login will be handled by App router when user is null
  };

  // Register activity listeners
  useEffect(() => {
    if (!user) return;

    activityListenerRef.current = () => {
      resetInactivityTimer();
    };

    // Register activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, activityListenerRef.current, { passive: true });
    });

    // Initial timer
    resetInactivityTimer();

    return () => {
      // Cleanup listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, activityListenerRef.current);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (forceRefresh = false) => {
    // Prevent duplicate simultaneous requests
    if (fetchingRef.current && !forceRefresh) return;

    // Use cached data if available and fresh
    const now = Date.now();
    if (!forceRefresh && cacheRef.current && (now - cacheTimeRef.current) < CACHE_DURATION) {
      setUser(cacheRef.current);
      setLoading(false);
      isLoggedOutRef.current = false;
      resetInactivityTimer();
      return;
    }

    fetchingRef.current = true;
    setLoading(true);

    try {
      const response = await getProfile();
      const userData = response.data?.data?.user || response.data?.user || response.user;

      // Update cache
      cacheRef.current = userData;
      cacheTimeRef.current = now;
      setUser(userData);
      isLoggedOutRef.current = false;
      resetInactivityTimer();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
      cacheRef.current = null;
      isLoggedOutRef.current = true;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleExtendSession = () => {
    setSessionWarning(false);
    resetInactivityTimer();
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      refreshUser: fetchUser,
      sessionWarning,
      handleExtendSession,
      lastActivity,
      SESSION_TIMEOUT
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
