// src/AuthContext/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // contains name, email, role, etc.
  const [token, setToken] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("token", userData.token);
    sessionStorage.setItem("userRole", userData.role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
