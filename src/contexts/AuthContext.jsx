import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Fetch user data if token exists
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token: newToken, user: userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (username, email, password, role = 'seller') => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
        role
      });

      const { token: newToken, user: userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
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