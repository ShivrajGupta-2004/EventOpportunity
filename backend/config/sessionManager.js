// config/sessionManager.js - Complete Session Management Module
const session = require("express-session");

class SessionManager {
  
  // Session Configuration
  static getSessionConfig() {
    return {
      secret: 'event-opportunity-secret-key-2024',
      resave: false,
      saveUninitialized: false,  // Changed to false
      name: 'connect.sid',       // Changed to standard name
      cookie: { 
        httpOnly: false,         // Changed to false for cross-origin
        secure: false,
        sameSite: false,         // Disabled sameSite for development
        maxAge: 24 * 60 * 60 * 1000,
        domain: undefined        // Let browser handle domain
      },
      rolling: true
    };
  }

  // Initialize Session Middleware
  static initializeSession() {
    return session(this.getSessionConfig());
  }

  // Create User Session
  static createUserSession(req, user) {
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.userType = 'user';
    req.session.email = user.email;
    req.session.isAuthenticated = true;
    
    console.log(`✅ User session created: ${user.username} (ID: ${user._id})`);
    return req.session;
  }

  // Create Admin Session
  static createAdminSession(req, admin) {
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.userType = 'admin';
    req.session.email = admin.email;
    req.session.isAuthenticated = true;
    
    console.log(`✅ Admin session created: ${admin.username} (ID: ${admin._id})`);
    return req.session;
  }

  // Check if User is Authenticated
  static isAuthenticated(req) {
    return !!(req.session && req.session.isAuthenticated && (req.session.userId || req.session.adminId));
  }

  // Check if User Type
  static isUser(req) {
    return req.session && req.session.userType === 'user' && req.session.userId;
  }

  // Check if Admin Type
  static isAdmin(req) {
    return req.session && req.session.userType === 'admin' && req.session.adminId;
  }

  // Get Session Info
  static getSessionInfo(req) {
    if (!this.isAuthenticated(req)) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      sessionId: req.sessionID,
      userId: req.session.userId || null,
      adminId: req.session.adminId || null,
      username: req.session.username,
      email: req.session.email,
      userType: req.session.userType,
      loginTime: req.session.cookie.originalMaxAge ? 
        new Date(Date.now() - req.session.cookie.originalMaxAge + req.session.cookie.maxAge) : 
        new Date()
    };
  }

  // Destroy Session (Logout)
  static destroySession(req, res) {
    return new Promise((resolve, reject) => {
      const username = req.session.username;
      const userType = req.session.userType;
      
      req.session.destroy((err) => {
        if (err) {
          console.error(`❌ Session destroy error for ${username}:`, err);
          reject(err);
        } else {
          res.clearCookie('sessionId');
          console.log(`🔓 Session destroyed for ${username} (${userType})`);
          resolve(true);
        }
      });
    });
  }

  // Session Validation Middleware
  static requireAuth(req, res, next) {
    if (!SessionManager.isAuthenticated(req)) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/userLogin.html'
      });
    }
    next();
  }

  // User-specific Authentication Middleware
  static requireUserAuth(req, res, next) {
    if (!SessionManager.isUser(req)) {
      return res.status(401).json({ 
        error: 'User authentication required',
        redirect: '/userLogin.html'
      });
    }
    next();
  }

  // Admin-specific Authentication Middleware
  static requireAdminAuth(req, res, next) {
    if (!SessionManager.isAdmin(req)) {
      return res.status(401).json({ 
        error: 'Admin authentication required',
        redirect: '/adminLogin.html'
      });
    }
    next();
  }

  // Session Logging Middleware
  static logSession(req, res, next) {
    console.log(`${req.method} ${req.url} - Session ID: ${req.sessionID}`);
    
    if (SessionManager.isAuthenticated(req)) {
      console.log(`🔐 Authenticated: ${req.session.username} (${req.session.userType})`);
    } else {
      console.log(`🔓 Not authenticated`);
    }
    
    next();
  }

  // Update Session Activity (for rolling sessions)
  static updateSessionActivity(req) {
    if (req.session && req.session.isAuthenticated) {
      req.session.lastActivity = new Date();
      req.session.touch(); // Update session expiry
    }
  }

  // Check Session Expiry
  static isSessionExpired(req) {
    if (!req.session || !req.session.cookie) return true;
    
    const now = Date.now();
    const expires = req.session.cookie._expires;
    
    return expires && now > expires.getTime();
  }

  // Refresh Session
  static refreshSession(req) {
    if (req.session && req.session.isAuthenticated) {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // Reset to 24 hours
      this.updateSessionActivity(req);
      console.log(`🔄 Session refreshed for ${req.session.username}`);
    }
  }

  // Get All Active Sessions Info (for debugging)
  static getSessionDebugInfo(req) {
    return {
      sessionId: req.sessionID,
      authenticated: this.isAuthenticated(req),
      isUser: this.isUser(req),
      isAdmin: this.isAdmin(req),
      sessionData: req.session,
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };
  }

  // Clear Expired Sessions (manual cleanup)
  static clearExpiredSessions(store) {
    if (store && typeof store.clear === 'function') {
      store.clear((err) => {
        if (err) {
          console.error('❌ Error clearing expired sessions:', err);
        } else {
          console.log('🧹 Expired sessions cleared');
        }
      });
    }
  }
}

module.exports = SessionManager;