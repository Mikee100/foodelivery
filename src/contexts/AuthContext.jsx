import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Restore restaurantId and deliveryPersonId if present in user object
        if (parsedUser.restaurantId) {
          localStorage.setItem('restaurantId', parsedUser.restaurantId);
        }
        if (parsedUser.deliveryPersonId) {
          localStorage.setItem('deliveryPersonId', parsedUser.deliveryPersonId);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      // Store restaurantId and deliveryPersonId if present
      if (userData.restaurantId) {
        localStorage.setItem('restaurantId', userData.restaurantId);
      } else {
        localStorage.removeItem('restaurantId');
      }
      if (userData.deliveryPersonId) {
        localStorage.setItem('deliveryPersonId', userData.deliveryPersonId);
      } else {
        localStorage.removeItem('deliveryPersonId');
      }

      // Set user state
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      await authAPI.signup(userData);

      return { success: true, message: 'User created successfully' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('restaurantId');
    localStorage.removeItem('deliveryPersonId');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear user state
    setUser(null);
    setError(null);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
    if (newUserData.restaurantId) {
      localStorage.setItem('restaurantId', newUserData.restaurantId);
    }
    if (newUserData.deliveryPersonId) {
      localStorage.setItem('deliveryPersonId', newUserData.deliveryPersonId);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const getUserRole = () => {
    return user?.role;
  };

  const getRestaurantId = () => {
    return user?.restaurantId || localStorage.getItem('restaurantId');
  };

  const getDeliveryPersonId = () => {
    return user?.deliveryPersonId || localStorage.getItem('deliveryPersonId');
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
    updateUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    getUserRole,
    getRestaurantId,
    getDeliveryPersonId,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 