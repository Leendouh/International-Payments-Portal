import { useState, useEffect, useContext, createContext } from 'react';
import { api } from '../services/api';
import websocketService from '../services/websocket';

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
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');

  useEffect(() => {
    // Initialize WebSocket connection
    websocketService.connect();
    
    // Set up real-time event listeners
    setupRealtimeListeners();
    
    // Check initial auth status
    checkAuthStatus();
    
    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const setupRealtimeListeners = () => {
    // Connection status
    websocketService.on('connect', () => {
      setRealtimeStatus('connected');
      if (user) {
        websocketService.authenticate(user.id);
      }
    });

    websocketService.on('disconnect', () => {
      setRealtimeStatus('disconnected');
    });

    // Real-time authentication events
    websocketService.on('loginSuccess', (data) => {
      console.log('🔐 Real-time login success received:', data);
      setUser(data.user);
      websocketService.authenticate(data.user.id);
    });

    websocketService.on('registrationSuccess', (data) => {
      console.log('📝 Real-time registration success received:', data);
      setUser(data.user);
      websocketService.authenticate(data.user.id);
    });

    websocketService.on('logoutSuccess', () => {
      console.log('🔓 Real-time logout success received');
      setUser(null);
    });

    websocketService.on('sessionExpired', () => {
      console.log('⏰ Real-time session expiration received');
      setUser(null);
    });

    websocketService.on('securityAlert', (data) => {
      console.log('🚨 Real-time security alert received:', data);
      // Handle security alerts (e.g., force logout on suspicious activity)
      if (data.severity === 'high') {
        setUser(null);
      }
    });
  };

  const checkAuthStatus = async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/auth/profile');
      console.log('Auth check response:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.log('Auth check error:', error);
      // Clear token and user on authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
      // For other errors, keep the current user state
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      // Notify server of login attempt for real-time monitoring
      websocketService.notifyLoginAttempt(credentials.email);
      
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      // Store JWT token in localStorage
      localStorage.setItem('token', token);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Authenticate for real-time updates
      websocketService.authenticate(user.id);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // Notify server of registration attempt for real-time monitoring
      websocketService.notifyRegistrationAttempt(userData);
      
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      // Store JWT token in localStorage
      localStorage.setItem('token', token);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Authenticate for real-time updates
      websocketService.authenticate(user.id);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      
      // Clear JWT token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // WebSocket logout event will be handled by the server
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user state and re-authenticate with WebSocket when user changes
  useEffect(() => {
    if (user && realtimeStatus === 'connected') {
      websocketService.authenticate(user.id);
    }
  }, [user, realtimeStatus]);

  return (
    <AuthContext.Provider value={{
      user, 
      loading, 
      login, 
      register, 
      logout,
      realtimeStatus,
      websocketStatus: websocketService.getStatus()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Default export for better Fast Refresh compatibility
export default useAuth;
