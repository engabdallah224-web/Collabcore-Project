import { createContext, useState, useEffect, useCallback } from 'react';
import { subscribeToAuthChanges, logout as logoutService } from '../services/authService';
import { supabase } from '../config/supabase';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Subscribe to auth state changes
  useEffect(() => {

    const unsubscribe = subscribeToAuthChanges(({ user: userData }) => {

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);


  // Login function
  const login = useCallback((userData) => {

    setUser(userData);
    setIsAuthenticated(true);

  }, []);


  // Logout function
  const logout = useCallback(async () => {

    try {

      await logoutService();
      setUser(null);
      setIsAuthenticated(false);

    } catch (error) {

      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);

    }

  }, []);


  // Update user data
  const updateUser = useCallback((userData) => {

    setUser((prev) => ({ ...prev, ...userData }));

  }, []);


  // Get current Supabase user
  const getFirebaseUser = useCallback(async () => {

    const { data } = await supabase.auth.getUser();
    return data?.user || null;

  }, []);


  // Get fresh access token
  const getIdToken = useCallback(async () => {

    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;

  }, []);


  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    getFirebaseUser,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};