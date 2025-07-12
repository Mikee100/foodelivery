// src/AuthContext/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage/sessionStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  });

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    
    // Store complete user object
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
    
    // Store individual fields for backward compatibility
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("userName", userData.name || userData.username);
    
    // Store restaurant and delivery person IDs if they exist
    if (userData.restaurantId) {
      localStorage.setItem("restaurantId", userData.restaurantId);
    }
    if (userData.deliveryPersonId) {
      localStorage.setItem("deliveryPersonId", userData.deliveryPersonId);
    }
    
    // Also store in sessionStorage for backward compatibility
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("token", userData.token);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("userRole", userData.role);
    sessionStorage.setItem("userName", userData.name || userData.username);
  };
 

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.clear();
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
