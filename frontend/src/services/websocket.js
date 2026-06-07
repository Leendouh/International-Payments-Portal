import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

/**
 * Real-time WebSocket Service
 * Handles real-time authentication events and notifications
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Event callbacks
    this.callbacks = {
      connect: [],
      disconnect: [],
      authenticated: [],
      loginSuccess: [],
      registrationSuccess: [],
      logoutSuccess: [],
      sessionExpired: [],
      securityAlert: [],
      sessionStatus: [],
      systemNotification: [],
      error: []
    };
  }

  /**
   * Initialize WebSocket connection
   */
  connect() {
    if (this.socket && this.isConnected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to real-time WebSocket service...');
    
    this.socket = io('https://192.168.18.23:8443', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      rejectUnauthorized: false // Allow self-signed certificates in development
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Real-time WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect', { connected: true });
      
      // Show connection success toast
      toast.success('Real-time connection established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Real-time WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', { reason });
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to establish real-time connection');
      }
      
      this.emit('error', { error: error.message });
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('🔐 Real-time authentication confirmed:', data);
      this.emit('authenticated', data);
    });

    // Login events
    this.socket.on('login_success', (data) => {
      console.log('✅ Real-time login success:', data);
      toast.success(data.message || 'Login successful!');
      this.emit('loginSuccess', data);
    });

    this.socket.on('user_logged_in', (data) => {
      console.log('👤 User logged in (broadcast):', data);
      this.emit('userLoggedIn', data);
    });

    // Registration events
    this.socket.on('registration_success', (data) => {
      console.log('✅ Real-time registration success:', data);
      toast.success(data.message || 'Registration successful!');
      this.emit('registrationSuccess', data);
    });

    this.socket.on('user_registered', (data) => {
      console.log('👤 User registered (broadcast):', data);
      this.emit('userRegistered', data);
    });

    // Logout events
    this.socket.on('logout_success', (data) => {
      console.log('✅ Real-time logout success:', data);
      toast.success(data.message || 'Logout successful!');
      this.emit('logoutSuccess', data);
    });

    this.socket.on('user_logged_out', (data) => {
      console.log('👤 User logged out (broadcast):', data);
      this.emit('userLoggedOut', data);
    });

    // Session events
    this.socket.on('session_expired', (data) => {
      console.log('⏰ Real-time session expired:', data);
      toast.error(data.message || 'Session expired! Please login again.');
      this.emit('sessionExpired', data);
    });

    this.socket.on('session_status', (data) => {
      console.log('🔍 Session status:', data);
      this.emit('sessionStatus', data);
    });

    // Security events
    this.socket.on('security_alert', (data) => {
      console.log('🚨 Real-time security alert:', data);
      toast.error(data.message || 'Security alert!');
      this.emit('securityAlert', data);
    });

    // System notifications
    this.socket.on('system_notification', (data) => {
      console.log('📢 System notification:', data);
      
      // Show appropriate toast based on type
      switch (data.type) {
        case 'success':
          toast.success(data.message);
          break;
        case 'error':
          toast.error(data.message);
          break;
        case 'warning':
          toast.error(data.message);
          break;
        default:
          toast(data.message);
      }
      
      this.emit('systemNotification', data);
    });

    // Login attempt monitoring
    this.socket.on('user_login_attempt', (data) => {
      console.log('🔐 Login attempt detected:', data);
      this.emit('loginAttempt', data);
    });

    // Registration attempt monitoring
    this.socket.on('user_register_attempt', (data) => {
      console.log('📝 Registration attempt detected:', data);
      this.emit('registrationAttempt', data);
    });
  }

  /**
   * Authenticate user for real-time updates
   */
  authenticate(userId) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot authenticate: WebSocket not connected');
      return;
    }

    console.log('🔐 Authenticating for real-time updates:', userId);
    this.userId = userId;
    this.socket.emit('authenticate', { userId });
  }

  /**
   * Notify server of login attempt
   */
  notifyLoginAttempt(email) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('login_attempt', { email });
  }

  /**
   * Notify server of registration attempt
   */
  notifyRegistrationAttempt(data) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('register_attempt', data);
  }

  /**
   * Check session status
   */
  checkSessionStatus(sessionId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('check_session', sessionId);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to callbacks
   */
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
