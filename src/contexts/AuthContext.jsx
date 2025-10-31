import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { apiConfig } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults and fetch user data
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        
        // Fetch user data if token exists
        try {
          const response = await api.get(apiConfig.endpoints.auth.me);
          setUser(response.data.data.user);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // console.log('🔐 Attempting login with:', { email, endpoint: apiConfig.endpoints.auth.login });
      
      const response = await api.post(apiConfig.endpoints.auth.login, {
        email,
        password
      });

      // console.log('✅ Login response received:', response.data);
      const { token: newToken, user: userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (username, email, password, role = 'seller') => {
    try {
      const response = await api.post(apiConfig.endpoints.auth.register, {
        username,
        email,
        password,
        role
      });

      const { token: newToken, user: userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate session on server
      await api.post(apiConfig.endpoints.auth.logout);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local state
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get(apiConfig.endpoints.auth.me);
      setUser(response.data.data.user);
      return { success: true, user: response.data.data.user };
    } catch (error) {
      logout();
      return { success: false, message: 'Failed to fetch user data' };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};