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

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const register = async (userData, isAdmin = false) => {
    try {
      const response = isAdmin 
        ? await authAPI.registerAdmin(userData)
        : await authAPI.registerStudent(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const registerPublic = async (userData) => {
    try {
      const response = await authAPI.registerPublic(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isAuthenticated = () => !!user;

  const value = {
    user,
    login,
    logout,
    register,
    registerPublic,
    updateProfile,
    changePassword,
    isAdmin,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
