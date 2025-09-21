import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

// Create the context
const AuthContext = createContext();

// AuthProvider to wrap around the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.checkAuth();
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        setUser(null); // explicitly clear user if no success
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Not logged in → that's fine, just set user = null
        setUser(null);
        console.log('User not logged in');
      } else {
        console.error("Auth check failed", error);
      }
    } finally {
      setLoading(false);
    }
  };


  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        setUser(response.data.user);
        // console.log("Login success", response.data.user);
        // console.log("Login message from backend", response.data.message);
        return { success: true, message : response.data.message };
      }else {
      // backend responded but login failed
        const message = response?.data?.message || "Invalid credentials";
        console.error("Login failed:", message);
        return { success: false, message };  // ✅ return added here
     }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.signup({ name, email, password });
      
      if (response.data.success) {
        // setUser(response.data.user);
        return { success: true, message: response.data.message  };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};