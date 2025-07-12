// src/AuthContext/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // contains name, email, role, etc.
  const [token, setToken] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    
    // Store in localStorage for consistency with other components
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("userName", userData.name);
    
    // Store restaurant and delivery person IDs if they exist
    if (userData.restaurantId) {
      localStorage.setItem("restaurantId", userData.restaurantId);
    }
    if (userData.deliveryPersonId) {
      localStorage.setItem("deliveryPersonId", userData.deliveryPersonId);
    }
    
    // Also store in sessionStorage for backward compatibility
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("token", userData.token);
    sessionStorage.setItem("userRole", userData.role);
    sessionStorage.setItem("userName", userData.name);
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
