const { Server } = require('socket.io');
const { auditLog } = require('./logger');

/**
 * Real-time WebSocket Service
 * Handles real-time authentication events and notifications
 */

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://192.168.18.23:3000",
        "https://192.168.18.23:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 Real-time connection established: ${socket.id}`);
    
    // Join user to their personal room for targeted notifications
    socket.on('authenticate', (userData) => {
      if (userData?.userId) {
        socket.join(`user_${userData.userId}`);
        socket.userId = userData.userId;
        console.log(`👤 User ${userData.userId} authenticated for real-time updates`);
        
        // Send confirmation
        socket.emit('authenticated', {
          success: true,
          message: 'Real-time connection authenticated',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle real-time login attempts
    socket.on('login_attempt', (loginData) => {
      console.log(`🔐 Real-time login attempt for: ${loginData.email}`);
      
      // Broadcast login attempt to admin dashboard (if exists)
      socket.broadcast.emit('user_login_attempt', {
        email: loginData.email,
        timestamp: new Date().toISOString(),
        ip: socket.handshake.address
      });
    });

    // Handle real-time registration attempts
    socket.on('register_attempt', (registerData) => {
      console.log(`📝 Real-time registration attempt for: ${registerData.email}`);
      
      // Broadcast registration attempt to admin dashboard (if exists)
      socket.broadcast.emit('user_register_attempt', {
        email: registerData.email,
        fullName: registerData.fullName,
        timestamp: new Date().toISOString(),
        ip: socket.handshake.address
      });
    });

    // Handle session status requests
    socket.on('check_session', async (sessionId) => {
      try {
        const db = require('./database');
        const query = `
          SELECT s.*, c.id as customer_id, c.email, c.full_name
          FROM user_sessions s
          JOIN customers c ON s.customer_id = c.id
          WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP
        `;
        
        const result = await db.query(query, [sessionId]);
        
        if (result.rows.length > 0) {
          const session = result.rows[0];
          socket.emit('session_status', {
            valid: true,
            user: {
              id: session.customer_id,
              email: session.email,
              fullName: session.full_name
            },
            expiresAt: session.expires_at
          });
        } else {
          socket.emit('session_status', {
            valid: false,
            message: 'Session expired or invalid'
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
        socket.emit('session_status', {
          valid: false,
          message: 'Error checking session'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Real-time connection disconnected: ${socket.id}`);
      if (socket.userId) {
        console.log(`👤 User ${socket.userId} disconnected from real-time updates`);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

// Real-time event emitters
const emitLoginSuccess = (userId, userData) => {
  if (io) {
    io.to(`user_${userId}`).emit('login_success', {
      success: true,
      user: userData,
      timestamp: new Date().toISOString(),
      message: 'Login successful - Real-time update'
    });
    
    // Broadcast to all connected clients (for admin notifications)
    io.emit('user_logged_in', {
      userId: userId,
      email: userData.email,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Real-time login success sent to user ${userId}`);
  }
};

const emitRegistrationSuccess = (userId, userData) => {
  if (io) {
    io.to(`user_${userId}`).emit('registration_success', {
      success: true,
      user: userData,
      timestamp: new Date().toISOString(),
      message: 'Registration successful - Real-time update'
    });
    
    // Broadcast to all connected clients (for admin notifications)
    io.emit('user_registered', {
      userId: userId,
      email: userData.email,
      fullName: userData.fullName,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Real-time registration success sent to user ${userId}`);
  }
};

const emitLogout = (userId) => {
  if (io) {
    io.to(`user_${userId}`).emit('logout_success', {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Logout successful - Real-time update'
    });
    
    // Broadcast to all connected clients (for admin notifications)
    io.emit('user_logged_out', {
      userId: userId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Real-time logout sent to user ${userId}`);
  }
};

const emitSessionExpired = (userId) => {
  if (io) {
    io.to(`user_${userId}`).emit('session_expired', {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Session expired - Please login again'
    });
    
    console.log(`📡 Real-time session expiration sent to user ${userId}`);
  }
};

const emitSecurityAlert = (userId, alertData) => {
  if (io) {
    io.to(`user_${userId}`).emit('security_alert', {
      ...alertData,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Real-time security alert sent to user ${userId}`);
  }
};

// Get active connections count
const getActiveConnections = () => {
  return io ? io.engine.clientsCount : 0;
};

// Broadcast system notifications
const broadcastSystemNotification = (message, type = 'info') => {
  if (io) {
    io.emit('system_notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 System notification broadcasted: ${message}`);
  }
};

module.exports = {
  initializeWebSocket,
  emitLoginSuccess,
  emitRegistrationSuccess,
  emitLogout,
  emitSessionExpired,
  emitSecurityAlert,
  getActiveConnections,
  broadcastSystemNotification
};
